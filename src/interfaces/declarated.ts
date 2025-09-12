export interface Protocol {
    cron?:         Cron;
    dependencies?: string[];
    gateway?:      Gateway;
    processors?:   { [key: string]: Processor };
    services?:     { [key: string]: Service };
}

export interface Cron {
    jobs:     { [key: string]: Job };
    timezone: string;
}

export interface Job {
    execute:     string;
    onComplete?: string;
    onError?:    string;
    pattern:     string;
}

export interface Gateway {
    events?: { [key: string]: Event };
    http?:   HTTP;
}

export interface Event {
    contract: string;
    execute:  string;
    onError?: string;
}

export interface HTTP {
    middlewares?: string[];
    routes:       { [key: string]: any };
}

export interface Processor {
    contract:    string;
    execute:     string;
    onComplete?: string;
    onError?:    string;
    [property: string]: any;
}

export interface Service {
    actions:    { [key: string]: Action };
    transports: string[];
    version:    number;
}

export interface Action {
    contract: string;
    execute:  string;
}
