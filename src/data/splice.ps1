$mainFile = "d:\Trae CN\xiangmu\src\data\mockData.ts"
$insertFile = "d:\Trae CN\xiangmu\src\data\teenager_insert.txt"
$tempFile = "d:\Trae CN\xiangmu\src\data\mockData_temp.ts"

# Read the main file
$lines = Get-Content $mainFile -Encoding UTF8
$totalLines = $lines.Count
Write-Output "Total lines in mockData.ts: $totalLines"

# Split at line 13468 (0-indexed: 13467)
$part1 = $lines[0..13467]  # lines 1-13468
$part2 = $lines[13468..($totalLines-1)]  # lines 13469-end

Write-Output "Part1 lines: $($part1.Count)"
Write-Output "Part2 lines: $($part2.Count)"

# Read insert content
$insertContent = Get-Content $insertFile -Raw -Encoding UTF8

# Combine
$combined = $part1 + $insertContent + "`r`n" + ($part2 -join "`r`n")

# Write to temp file
[System.IO.File]::WriteAllText($tempFile, $combined, [System.Text.UTF8Encoding]::new($false))

Write-Output "Temp file written successfully"
Write-Output "Temp file size: $((Get-Item $tempFile).Length) bytes"
