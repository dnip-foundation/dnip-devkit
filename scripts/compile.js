import { execSync as exec } from 'node:child_process';

exec('quicktype -s schema ./json-schema/contract.json -o ./src/interfaces/contract.ts --just-types --top-level=Contract')
exec('quicktype -s schema ./json-schema/protocol.json -o ./src/interfaces/declarated.ts --just-types --top-level=Protocol');
exec('quicktype -s schema ./json-schema/implemented.json -o ./src/interfaces/implemented.ts --just-types --top-level=Protocol');
