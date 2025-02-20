import { Output, randomPassword, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];
  const databasePassword = randomPassword();
  const redisPassword = randomPassword();

  const common_envs = [
    `REDIS_HOST=$(PROJECT_NAME)_${input.appServiceName}-redis`,
    `REDIS_PASSWORD=${redisPassword}`,
    `DB_CONNECTION=pgsql`,
    `DB_HOST=$(PROJECT_NAME)_${input.appServiceName}-db`,
    `DB_PORT=5432`,
    `DB_DATABASE=$(PROJECT_NAME)`,
    `DB_USERNAME=postgres`,
    `DB_PASSWORD=${databasePassword}`,
    `APP_URL=https://$(PRIMARY_DOMAIN)`,
    `MAIL_MAILER=smtp`,
    `MAIL_HOST=${input.mailerHost}`,
    `MAIL_PORT=${input.mailerHostPort}`,
    `MAIL_USERNAME=${input.mailerHostUser}`,
    `MAIL_PASSWORD=${input.mailerPassword}`,
    `MAIL_FROM_ADDRESS=${input.mailerSender}`,
  ].join("\n");

  services.push({
    type: "app",
    data: {
      serviceName: input.appServiceName,
      env: [common_envs].join("\n"),
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 80,
        },
      ],
      mounts: [
        {
          type: "volume",
          name: "storage",
          mountPath: "/var/www/html/storage",
        },
        {
          type: "volume",
          name: "config",
          mountPath: "/var/www/html/.env",
        },
      ],
    },
  });

  services.push({
    type: "app",
    data: {
      serviceName: `${input.appServiceName}-migration`,
      env: [common_envs].join("\n"),
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      deploy: {
        command: "php artisan migrate --force && php artisan db:seed --force",
      },
      mounts: [
        {
          type: "volume",
          name: "storage",
          mountPath: "/var/www/html/storage",
        },
        {
          type: "volume",
          name: "config",
          mountPath: "/var/www/html/.env",
        },
      ],
    },
  });

  services.push({
    type: "postgres",
    data: {
      serviceName: `${input.appServiceName}-db`,
      password: databasePassword,
    },
  });

  services.push({
    type: "redis",
    data: {
      serviceName: `${input.appServiceName}-redis`,
      password: redisPassword,
    },
  });

  return { services };
}
