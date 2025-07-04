import { Command } from "commander";
import { loadConfig } from "../core/database/config";
import { planCommand, applyCommand } from "./commands/index";

export async function runCLI() {
  const program = new Command();

  program
    .name("pgterra")
    .description("Infrastructure as Code for PostgreSQL databases")
    .version("1.0.0");

  program
    .command("plan")
    .description("Show what changes would be applied")
    .option("-f, --file <file>", "Schema file path", "schema.sql")
    .action(async (options) => {
      const config = loadConfig();
      await planCommand(options, config);
    });

  program
    .command("apply")
    .description("Apply schema changes to database")
    .option("-f, --file <file>", "Schema file path", "schema.sql")
    .action(async (options) => {
      const config = loadConfig();
      await applyCommand(options, config);
    });

  await program.parseAsync();
}
