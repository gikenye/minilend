"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTransactionDTO = exports.CreateTransactionDTO = void 0;
class CreateTransactionDTO {
    constructor(address, amount, type, description) {
        this.address = address;
        this.amount = amount;
        this.type = type;
        this.description = description;
    }
}
exports.CreateTransactionDTO = CreateTransactionDTO;
class UpdateTransactionDTO {
    constructor(status) {
        this.status = status;
    }
}
exports.UpdateTransactionDTO = UpdateTransactionDTO;
