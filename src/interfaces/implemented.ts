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
    execute:            any;
    executeOnComplete?: any;
    name:               string;
    pattern:            string;
}

export interface Gateway {
    middlewares: any[];
    routes:      Route[];
}

export interface Route {
    action?: Action | string;
    method:  Method;
    url:     string;
}

export interface Action {
    execute:     any;
    executePath: string;
    headers:     any;
    input:       any;
    meta:        { [key: string]: any };
    middlewares: any;
    output:      any;
}

export enum Method {
    Delete = "DELETE",
    Get = "GET",
    Patch = "PATCH",
    Post = "POST",
    Put = "PUT",
}

export interface Service {
    actions:    { [key: string]: Action };
    transports: Transport[];
    version:    number;
}

export enum Transport {
    AMQP = "amqp",
    Kafka = "kafka",
    Mqtt = "mqtt",
    Nats = "nats",
    Redis = "redis",
}
