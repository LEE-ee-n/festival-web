# Storage restore test

This test never writes to the existing production buckets.

1. Select three objects from the latest completed Storage snapshot, preferring different source buckets.
2. Create a uniquely named private test bucket.
3. Upload each local backup blob under `<source-bucket>/<original-path>`.
4. Download the restored objects and compare SHA-256 hashes.
5. Empty and delete the test bucket.
6. Save the test result under `Documents/FestibomOperations/restore-tests`.

Run:

```powershell
Set-Location -LiteralPath "C:\Users\소닉스\Documents\festibom"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\operations\restore\Test-FestibomStorageRestore.ps1"
```

Success output ends with `Storage restore test: OK (3 objects)`. The private test bucket is deleted automatically.
