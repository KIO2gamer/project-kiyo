# Script to sort Discord bot commands into appropriate category folders
$projectRoot = "c:\Users\KIO2gamer\github_projects\project-kiyo"
$commandsDir = Join-Path $projectRoot "src\bot\commands"

# Ensure all category directories exist
$categories = @("admin", "fun", "games", "info", "moderation", "setup", "utility")
foreach ($category in $categories) {
    $categoryPath = Join-Path $commandsDir $category
    if (-not (Test-Path $categoryPath)) {
        Write-Host "Creating directory: $categoryPath"
        New-Item -ItemType Directory -Path $categoryPath -Force | Out-Null
    }
}

# Get all command files recursively
$commandFiles = Get-ChildItem -Path $commandsDir -Filter "*.js" -Recurse

foreach ($file in $commandFiles) {
    # Skip files in the root of commands directory
    if ($file.DirectoryName -eq $commandsDir) {
        continue
    }
    
    # Read the file content to determine its category
    $content = Get-Content -Path $file.FullName -Raw
    
    # Try to extract the category from the file
    $categoryMatch = [regex]::Match($content, "category:\s*['`"]([^'`"]+)['`"]")
    
    if ($categoryMatch.Success) {
        $fileCategory = $categoryMatch.Groups[1].Value.ToLower()
        
        # Map some categories to standard names
        switch ($fileCategory) {
            "customs" { $fileCategory = "utility" }
            "utility" { $fileCategory = "utility" }
            "general" { $fileCategory = "info" }
            default { }
        }
        
        # Check if the category is valid
        if ($categories -contains $fileCategory) {
            $targetDir = Join-Path $commandsDir $fileCategory
            $targetPath = Join-Path $targetDir $file.Name
            
            # Check if file is already in the correct directory
            $currentDir = Split-Path $file.DirectoryName -Leaf
            
            if ($currentDir -ne $fileCategory) {
                Write-Host "Moving $($file.Name) from $currentDir to $fileCategory"
                
                # Move the file to the appropriate category directory
                Move-Item -Path $file.FullName -Destination $targetPath -Force
            } else {
                Write-Host "$($file.Name) is already in the correct directory: $fileCategory"
            }
        } else {
            Write-Host "Unknown category '$fileCategory' for file $($file.Name), leaving in place"
        }
    } else {
        Write-Host "Could not determine category for $($file.Name), leaving in place"
    }
}

Write-Host "`nCommand sorting complete!"