Add-Type -AssemblyName System.Drawing

$srcPath = "d:\aparna-saree-pre-pleating\src\assets\lady-logo.png"
$resDir = "d:\aparna-saree-pre-pleating\android\app\src\main\res"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Save-ScaledImage {
    param(
        [System.Drawing.Image]$source,
        [int]$canvasWidth,
        [int]$canvasHeight,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::Transparent
    )
    
    $bmp = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    if ($bgColor -ne [System.Drawing.Color]::Transparent) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $canvasWidth, $canvasHeight)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }
    
    $offsetX = [math]::Round(($canvasWidth - $targetWidth) / 2)
    $offsetY = [math]::Round(($canvasHeight - $targetHeight) / 2)
    
    $g.DrawImage($source, $offsetX, $offsetY, $targetWidth, $targetHeight)
    $g.Dispose()
    
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outputPath ($canvasWidth x $canvasHeight)"
}

$black = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)
$transparent = [System.Drawing.Color]::Transparent

# Config for densities:
# [folder, legacySize, legacyInner, foregroundSize, foregroundInner]
$densities = @(
    @{ Folder = "mipmap-mdpi";    Legacy = 48;  LegacyInner = 44;  Fg = 108; FgInner = 76 },
    @{ Folder = "mipmap-hdpi";    Legacy = 72;  LegacyInner = 66;  Fg = 162; FgInner = 114 },
    @{ Folder = "mipmap-xhdpi";   Legacy = 96;  LegacyInner = 88;  Fg = 216; FgInner = 152 },
    @{ Folder = "mipmap-xxhdpi";  Legacy = 144; LegacyInner = 132; Fg = 324; FgInner = 228 },
    @{ Folder = "mipmap-xxxhdpi"; Legacy = 192; LegacyInner = 176; Fg = 432; FgInner = 304 }
)

foreach ($d in $densities) {
    $targetFolder = Join-Path $resDir $d.Folder
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    }
    
    # 1. Foreground adaptive icon (transparent background, lady-logo centered in safe zone)
    $fgPath = Join-Path $targetFolder "ic_launcher_foreground.png"
    Save-ScaledImage -source $srcImg -canvasWidth $d.Fg -canvasHeight $d.Fg -targetWidth $d.FgInner -targetHeight $d.FgInner -outputPath $fgPath -bgColor $transparent

    # 2. Legacy launcher icon (black background, lady-logo centered)
    $launcherPath = Join-Path $targetFolder "ic_launcher.png"
    Save-ScaledImage -source $srcImg -canvasWidth $d.Legacy -canvasHeight $d.Legacy -targetWidth $d.LegacyInner -targetHeight $d.LegacyInner -outputPath $launcherPath -bgColor $black

    # 3. Legacy round launcher icon (black background, lady-logo centered)
    $roundPath = Join-Path $targetFolder "ic_launcher_round.png"
    Save-ScaledImage -source $srcImg -canvasWidth $d.Legacy -canvasHeight $d.Legacy -targetWidth $d.LegacyInner -targetHeight $d.LegacyInner -outputPath $roundPath -bgColor $black
}

$srcImg.Dispose()
Write-Output "All Android launcher icons successfully updated with lady-logo.png!"
