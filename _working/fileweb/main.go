// 静态文件Web服务器。
// 主要用于Tpb-module模式下的测试。
// 命令行可传入URL根目录（默认为运行命令的当前目录）。
package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	dir := "."
	addr := ":8080"

	if len(os.Args) > 1 {
		dir = os.Args[1]
	}
	log.Fatal(http.ListenAndServe(addr, http.FileServer(http.Dir(dir))))
}
