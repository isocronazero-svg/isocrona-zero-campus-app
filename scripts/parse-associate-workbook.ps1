param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-WorkbookXml {
  param($Zip, [string]$EntryPath)
  $entry = $Zip.GetEntry($EntryPath)
  if (-not $entry) {
    throw "No se encontro la entrada $EntryPath en el libro"
  }

  $reader = New-Object System.IO.StreamReader($entry.Open())
  try {
    return [xml]$reader.ReadToEnd()
  } finally {
    $reader.Dispose()
  }
}

function Get-SharedStrings {
  param($Zip)
  $entry = $Zip.GetEntry("xl/sharedStrings.xml")
  if (-not $entry) {
    return @()
  }

  $reader = New-Object System.IO.StreamReader($entry.Open())
  try {
    $xml = [xml]$reader.ReadToEnd()
  } finally {
    $reader.Dispose()
  }

  $items = New-Object System.Collections.Generic.List[string]
  foreach ($si in $xml.sst.si) {
    $items.Add([string]$si.InnerText)
  }
  return $items
}

function Get-CellText {
  param($Cell, $SharedStrings)
  $type = [string]$Cell.GetAttribute("t")
  $valueNode = $Cell.SelectSingleNode('./*[local-name()="v"]')

  if ($type -eq "inlineStr") {
    return [string]$Cell.InnerText
  }

  if (-not $valueNode) {
    return [string]$Cell.InnerText
  }

  $value = [string]$valueNode.InnerText
  if ($type -eq "s") {
    return $SharedStrings[[int]$value]
  }

  return $value
}

if (-not (Test-Path -LiteralPath $Path)) {
  throw "No existe el fichero $Path"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
  $workbook = Get-WorkbookXml $zip "xl/workbook.xml"
  $relationships = Get-WorkbookXml $zip "xl/_rels/workbook.xml.rels"
  $sharedStrings = Get-SharedStrings $zip

  $sheetById = @{}
  foreach ($relation in $relationships.Relationships.Relationship) {
    $sheetById[[string]$relation.Id] = [string]$relation.Target
  }

  $sheet = $workbook.workbook.sheets.sheet | Where-Object { [string]$_.name -eq "Listado de socios" } | Select-Object -First 1
  if (-not $sheet) {
    $sheet = $workbook.workbook.sheets.sheet | Select-Object -First 1
  }
  if (-not $sheet) {
    throw "No hay hojas en el libro"
  }

  $sheetId = [string]$sheet.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
  $target = $sheetById[$sheetId]
  if (-not $target) {
    throw "No se encontro la relacion de la hoja seleccionada"
  }

  $sheetPath = if ($target.StartsWith("/")) { $target.TrimStart("/") } else { "xl/$target" }
  $worksheet = Get-WorkbookXml $zip $sheetPath
  $rows = @($worksheet.worksheet.sheetData.row)
  if (-not $rows.Count) {
    throw "La hoja no contiene filas"
  }

  $headers = [ordered]@{}
  foreach ($cell in $rows[0].c) {
    $column = ([string]$cell.r -replace "\d", "")
    $headers[$column] = Get-CellText $cell $sharedStrings
  }

  $records = New-Object System.Collections.Generic.List[object]
  foreach ($row in ($rows | Select-Object -Skip 1)) {
    $record = [ordered]@{
      sourceRow = [int]$row.r
    }

    foreach ($cell in $row.c) {
      $column = ([string]$cell.r -replace "\d", "")
      $header = $headers[$column]
      if (-not $header) {
        continue
      }
      $record[$header] = Get-CellText $cell $sharedStrings
    }

    if ($record["Nombre"] -or $record["Apellidos"] -or $record["E-mail"]) {
      $records.Add([pscustomobject]$record)
    }
  }

  $output = [pscustomobject]@{
    sourcePath = $Path
    sheetName = [string]$sheet.name
    headers = @($headers.Values)
    rows = $records
  }

  $output | ConvertTo-Json -Depth 8 -Compress
} finally {
  $zip.Dispose()
}
