# Pipeline IVASPE para Test Zone

Esta carpeta contiene los CSV maestros de preguntas IVASPE que alimentan el banco de preguntas de Test Zone.

## Regla de trabajo

- Un archivo por bloque pequeno y revisable.
- Cada CSV real debe tener exactamente 25 preguntas.
- No se importan automaticamente al estado real al hacer merge.
- No tocar UI, Test en Vivo ni backend para anadir bloques de contenido.

## Cabecera obligatoria

```csv
prompt,optionA,optionB,optionC,optionD,correctIndex,part,category,difficulty,explanation,temaNumero,temaTitulo,moduleTitle
```

## Campos clave

- `part`: usar `IVASPE`.
- `category`: conservar la categoria real del bloque, por ejemplo `Sanitario operativo` o `Incendios urbanos y estructurales`.
- `difficulty`: usar `facil`, `media` o `dificil`.
- `correctIndex`: indice entre `0` y `3`.
- `moduleTitle`: usar `IVASPE` salvo decision explicita distinta.
- `explanation`: breve, profesional y util para repaso.

## Validacion

Antes de importar o abrir PR:

```bash
npm.cmd run check:test-zone-ivaspe-csv
npm.cmd run check:test-zone-csv
npm.cmd run check:test-zone-normalizer
npm.cmd run check:app
```

`check:test-zone-ivaspe-csv` valida todos los CSV reales de esta carpeta y omite `_template.csv`.

## Importacion

Vista previa sin escribir estado:

```bash
npm.cmd run import:test-zone-ivaspe -- --dry-run
```

Importacion real de todos los CSV IVASPE:

```bash
npm.cmd run import:test-zone-ivaspe
```

Importacion manual de un archivo concreto:

```bash
node scripts/import-test-zone-questions.mjs data/test-zone/ivaspe/nombre-del-archivo.csv
```

## Almacenamiento local

En Windows, si no se define `IZ_DATA_DIR`, la app usa normalmente `C:\data` como directorio de estado persistente. Para pruebas aisladas, usar un directorio temporal:

```bash
$env:IZ_DATA_DIR="C:\ruta\temporal\data"
npm.cmd run import:test-zone-ivaspe -- --dry-run
```

## Checks de humo

Tras importar bloques o tocar el pipeline:

```bash
npm.cmd run smoke:campus-test
npm.cmd run smoke:campus-live-test
```

Si se ejecuta `npm.cmd run test` y no existe script `test`, documentarlo asi en el PR.
