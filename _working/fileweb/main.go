package main

import (
	"fmt"
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
	path := http.Dir(dir)
	fmt.Println("dir:", path, " port", addr)

	log.Fatal(http.ListenAndServe(addr, http.FileServer(path)))
}
