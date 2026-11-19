"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
let GameController = class GameController {
    levels() { return { levels: ['Bosque de los Susurros', 'Lago de las Estrellas', 'Jardín Eterno'], goals: [3, 4, 5], prize: 'Vale por una cita contigo y flores moradas' }; }
};
__decorate([
    (0, common_1.Get)('levels'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GameController.prototype, "levels", null);
GameController = __decorate([
    (0, common_1.Controller)('api')
], GameController);
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({ controllers: [GameController] })
], AppModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'dist'));
    await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
