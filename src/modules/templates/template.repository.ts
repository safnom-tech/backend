import { env } from "../../config/env.js";
import { CodeTemplateRepository } from "./code-template.repository.js";
import { MongoTemplateRepository } from "./mongo-template.repository.js";
import type { TemplateRepository } from "./template.repository.types.js";

let repository: TemplateRepository | null = null;

export function getTemplateRepository(): TemplateRepository {
  if (repository) return repository;
  repository =
    env.templateSource === "mongo"
      ? new MongoTemplateRepository()
      : new CodeTemplateRepository();
  return repository;
}

export function setTemplateRepositoryForTests(
  next: TemplateRepository | null
): void {
  repository = next;
}
