import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';
import { PrerenderSettings } from './prerender';

export function readConfig() {
    let args = yargs
        .usage('prerender: prerender your spa sites for speed & seo!')
        .options({
            config: {
                type: "string",
                describe: "Path to the config file",
                default: "prerender.conf.json",
                requiresArg: true
            }
        })
        .help().alias("help", "h")
        .version().alias("version", "v")
        .argv;

    const defaultSettings: Partial<PrerenderSettings> = {
        root: 'dist',
        template: 'index.html',
        seed: ['index.html'],
        transition: 'blx-transition',
        port: 8080
    };
    const prerenderConfig: PrerenderSettings = {
        ...defaultSettings,
        ...JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.config)).toString())
    };
    for (let field in prerenderConfig) {
        if (['root', 'template', 'seed', 'bootstrap', 'transition', 'port', 'htmlSuffix', 'directoryIndex'].indexOf(field) === -1)
            throw new Error(args.config + ': unrecognized field ' + field);
    }
    checkType(prerenderConfig, 'root', 'string');
    checkType(prerenderConfig, 'template', 'string');
    checkArrayType(prerenderConfig, 'seed', 'string');
    checkArrayType(prerenderConfig, 'bootstrap', 'string');
    checkType(prerenderConfig, 'transition', 'string');
    checkType(prerenderConfig, 'port', 'number');
    checkType(prerenderConfig, 'htmlSuffix', 'string', true);
    checkType(prerenderConfig, 'directoryIndex', 'string', true);

    if (prerenderConfig.template.match(/(\.\.[$/])|(^\.\.)|\//))
        throw new Error(args.config + ": invalid value for template field");
    if (!prerenderConfig.transition.match(/^[a-zA-Z0-9-]+(=[^=]*)?$/))
        throw new Error(args.config + ": invalid value for transition field");

    return prerenderConfig;

    function checkType(settings: any, field: string, type: string, optional = false) {
        if (optional && settings[field] == null)
            return;
        else if (settings[field] == null)
            throw new Error(args.config + ': ' + field + ' field is missing');
        if (!(typeof settings[field] === type))
            throw new Error(args.config + ': ' + field + ' must have a ' + type + ' value');
    }

    function checkArrayType(settings: any, field: string, type: string) {
        if (settings[field] == null)
            throw new Error(args.config + ': ' + field + ' field is missing');
        if (!Array.isArray(settings[field])) {
            // make it an array, if it is a single field of the correct type:
            if (typeof settings[field] === type)
                settings[field] = [settings[field]];
            else
                throw new Error(args.config + ': ' + field + ' must be an array');
        }
        if (settings[field].length === 0)
            throw new Error(args.config + ': ' + field + ' must not be empty');
        for (let e of settings[field])
            if (!(typeof e === type))
                throw new Error(args.config + ': ' + field + ' must have ' + type + ' members only');
    }
}
