/**
 * Cooljed 编辑器发布更新程序。
 *
 * 从源码开发版 articlejs 中拷贝必要的文件到在线版 cooljed 目录内。
 * 其中源码里的部分文件经过了JS压缩以节省空间，
 * 但模板和样式部分保留了原本的格式，可便于使用者查看或修改（下载定制）。
 *
 * 请配合 /release.md 发布文件说明使用。
 * 
 * 在编辑器源目录执行编译后的程序（假设名为 coolju.exe）：
 *      ./coolju.exe -v
 *
 * 如在其它目录，可传递参数执行命令。如下命令查看使用说明。
 *      ./coolju.exe --help
 *
 * @Copyright: 2022 GPL/GNU v3
 * @Author: zhliner@gmail.com 2022.08.28.
 */
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"time"
)

var list = flag.String("list", "updates.json", "传入需要更新的文件和目录的列表")
var from = flag.String("from", ".", "指定更新源的目录（相对或绝对路径）。默认为当前目录")
var root = flag.String("to", "../coolj", "指定更新目标的根目录（相对或绝对路径）")
var verb = flag.Bool("v", false, "详细显示当前被复制的文件")

//
// 更新文件和目录集
//
type updates struct {
	Files []string `json:"files"`
	Dirs  []string `json:"dirs"`
}

//
// 通用复制函数。
//
type copyfun func(string, string) error

func main() {
	flag.Parse()

	_list, err := updateList(*list)
	if err != nil {
		log.Fatalf("读取清单文件 %s 出错\n", *list)
	}

	// 根文件复制
	if err = copyItem(_list.Files, copyFile); err != nil {
		log.Fatal(err)
	}

	// 子目录复制
	if err = copyItem(_list.Dirs, copyDir); err != nil {
		log.Fatal(err)
	}
}

//
// 获取更新配置列表。
//
func updateList(file string) (*updates, error) {
	_data, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}
	_list := new(updates)

	if err = json.Unmarshal(_data, _list); err != nil {
		return nil, err
	}
	return _list, nil
}

//
// 复制目标项（文件或目录）
//
func copyItem(list []string, fun copyfun) error {
	for _, v := range list {
		_src := filepath.Join(*from, v)
		_dst := filepath.Join(*root, v)

		if err := fun(_src, _dst); err != nil {
			return fmt.Errorf("拷贝文件 %s 出现错误: %v", _src, err)
		}
	}
	return nil
}

//
// 复制目标。
// 会递归地复制子目录里的文件。
//
func copyDir(src, dst string) error {
	_ents, err := ioutil.ReadDir(src)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ReadDir: %v\n", err)
		return err
	}
	var _fun copyfun

	for _, entry := range _ents {
		_sub := entry.Name()
		_src := filepath.Join(src, _sub)
		_dst := filepath.Join(dst, _sub)

		if entry.IsDir() {
			_fun = copyDir
		} else {
			_fun = copyFile
		}
		if err = _fun(_src, _dst); err != nil {
			return err
		}
	}
	return nil
}

//
// 复制文件。
// 会设置目标文件的修改时间与源文件相同。
//
func copyFile(src, dst string) error {
	_stat, err := os.Stat(src)
	if err != nil {
		return err
	}
	if !_stat.Mode().IsRegular() {
		return fmt.Errorf("%s is not a regular file", src)
	}
	if !_needcopy(dst, _stat.ModTime()) {
		// 简单略过
		return nil
	}
	_n, err := _copy(src, dst)
	if err != nil {
		return fmt.Errorf("copy file: %v", err)
	}
	if _n != _stat.Size() {
		// 仅提示
		fmt.Fprintf(os.Stderr, "%s and %s 's size is not same\n", src, dst)
	}
	_tm := _stat.ModTime()

	// 修改时间保持一致
	err = os.Chtimes(dst, _tm, _tm)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Chtimes: %v\n", err)
	}
	return err
}

//
// 复制一个文件。
// 返回源文件的基本信息，可供设置新复制的文件。
//
func _copy(src, dst string) (int64, error) {
	_src, err := os.Open(src)
	if err != nil {
		return 0, err
	}
	defer _src.Close()

	_dst, err := os.Create(dst)
	if err != nil {
		return 0, err
	}
	defer _dst.Close()

	if *verb {
		fmt.Println(src, "->", dst)
	}
	return io.Copy(_dst, _src)
}

//
// 检查目标文件是否需要复制。
// 如果目标文件存在且修改时间与mt相同，则忽略。
//
func _needcopy(dst string, mt time.Time) bool {
	_stat, err := os.Stat(dst)

	if err != nil {
		_ok := os.IsNotExist(err)
		if _ok {
			// 目录保证
			os.MkdirAll(filepath.Dir(dst), 0666)
		}
		return _ok
	}
	if _stat.ModTime() == mt {
		return false
	}
	return true
}
