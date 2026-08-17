Add-Type -AssemblyName System.Drawing

function Add-WhiteBackground($filePath) {
    $src = [System.Drawing.Bitmap]::FromFile($filePath)
    $w = $src.Width
    $h = $src.Height
    
    # Create new bitmap with white background
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Enable high quality rendering
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill white rectangle
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillRectangle($whiteBrush, 0, 0, $w, $h)
    
    # Draw original image on top
    $g.DrawImage($src, 0, 0, $w, $h)
    
    # Dispose reader graphic handles before saving back to file
    $src.Dispose()
    $g.Dispose()
    $whiteBrush.Dispose()
    
    # Save output to a temporary path, then replace original file
    $tempPath = $filePath + ".tmp.png"
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Remove-Item $filePath -Force
    Move-Item $tempPath $filePath -Force
    Write-Host "Updated $filePath with white background ($w x $h)"
}

Add-WhiteBackground "app/icon.png"
Add-WhiteBackground "app/apple-icon.png"
if (Test-Path "public/icon-512.png") { Add-WhiteBackground "public/icon-512.png" }
if (Test-Path "public/icon-192.png") { Add-WhiteBackground "public/icon-192.png" }
