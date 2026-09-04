package main

import (
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

func main() {
	var wg sync.WaitGroup
	requests := 50000
	var successCount int32 = 0
	var failCount int32 = 0

	fmt.Printf("Starting load test: %d requests...\n", requests)
	start := time.Now()

	for i := 0; i < requests; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			resp, err := http.Post("http://localhost:3000/buy-ticket", "application/json", nil)
			if err != nil {
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer resp.Body.Close()
			if resp.StatusCode == 200 {
				atomic.AddInt32(&successCount, 1)
			} else {
				atomic.AddInt32(&failCount, 1)
			}
		}()
	}

	wg.Wait()
	fmt.Printf("Test Completed in %v\n", time.Since(start))
	fmt.Printf("Tickets Secured: %d\n", successCount)
	fmt.Printf("Rejected/Failed: %d\n", failCount)
}