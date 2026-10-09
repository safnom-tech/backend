"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateRepository = getTemplateRepository;
exports.setTemplateRepositoryForTests = setTemplateRepositoryForTests;
const env_js_1 = require("../../config/env.js");
const code_template_repository_js_1 = require("./code-template.repository.js");
const mongo_template_repository_js_1 = require("./mongo-template.repository.js");
let repository = null;
function getTemplateRepository() {
    if (repository)
        return repository;
    repository =
        env_js_1.env.templateSource === "mongo"
            ? new mongo_template_repository_js_1.MongoTemplateRepository()
            : new code_template_repository_js_1.CodeTemplateRepository();
    return repository;
}
function setTemplateRepositoryForTests(next) {
    repository = next;
}
