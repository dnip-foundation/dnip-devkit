export interface Protocol {
    cron?:     Cron;
    gateway?:  Gateway;
    services?: { [key: string]: Service };
}

export interface Cron {
    disabled?: boolean;
    jobs:      Job[];
    timezone?: string;
}

export interface Job {
    disabled?:          boolean;
    execute:            string;
    executeOnComplete?: string;
    name:               string;
    pattern:            string;
}

export interface Gateway {
    middlewares?: string[];
    routes:       Routes;
}

export interface Routes {
}

export interface Service {
    actions:    { [key: string]: Action };
    transports: Transport[];
    version:    number;
}

export interface Action {
    contract:     string;
    execute:      string;
    middlewares?: string[];
}

export enum Transport {
    AMQP = "amqp",
    Kafka = "kafka",
    Mqtt = "mqtt",
    Nats = "nats",
    Redis = "redis",
}
