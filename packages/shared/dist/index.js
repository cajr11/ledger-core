"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = exports.FEE_RATE = exports.TransferStatus = exports.TransferType = exports.AccountType = exports.Ledger = void 0;
exports.canTransition = canTransition;
var Ledger;
(function (Ledger) {
    Ledger[Ledger["USD"] = 1] = "USD";
    Ledger[Ledger["USDC"] = 2] = "USDC";
    Ledger[Ledger["MXN"] = 3] = "MXN";
    Ledger[Ledger["COP"] = 4] = "COP";
    Ledger[Ledger["CAD"] = 5] = "CAD";
    Ledger[Ledger["GHS"] = 6] = "GHS";
    Ledger[Ledger["NGN"] = 7] = "NGN";
})(Ledger || (exports.Ledger = Ledger = {}));
var AccountType;
(function (AccountType) {
    AccountType[AccountType["USER_WALLET"] = 1] = "USER_WALLET";
    AccountType[AccountType["INTERNAL_POOL"] = 2] = "INTERNAL_POOL";
    AccountType[AccountType["FEE_COLLECTION"] = 3] = "FEE_COLLECTION";
    AccountType[AccountType["FUNDING_SOURCE"] = 4] = "FUNDING_SOURCE";
    AccountType[AccountType["OFF_RAMP"] = 5] = "OFF_RAMP";
})(AccountType || (exports.AccountType = AccountType = {}));
var TransferType;
(function (TransferType) {
    TransferType[TransferType["FUNDING"] = 1] = "FUNDING";
    TransferType[TransferType["WITHDRAWAL"] = 2] = "WITHDRAWAL";
    TransferType[TransferType["TRANSFER"] = 3] = "TRANSFER";
    TransferType[TransferType["CONVERSION"] = 4] = "CONVERSION";
    TransferType[TransferType["FEE"] = 5] = "FEE";
    TransferType[TransferType["REFUND"] = 6] = "REFUND";
})(TransferType || (exports.TransferType = TransferType = {}));
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["INITIATED"] = "INITIATED";
    TransferStatus["COLLECTING"] = "COLLECTING";
    TransferStatus["FUNDS_RECEIVED"] = "FUNDS_RECEIVED";
    TransferStatus["CONVERTING"] = "CONVERTING";
    TransferStatus["SENDING"] = "SENDING";
    TransferStatus["COMPLETED"] = "COMPLETED";
    TransferStatus["FAILED"] = "FAILED";
    TransferStatus["REFUNDING"] = "REFUNDING";
    TransferStatus["REFUNDED"] = "REFUNDED";
    TransferStatus["CANCELLED"] = "CANCELLED";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
exports.FEE_RATE = 0.015;
exports.VALID_TRANSITIONS = {
    [TransferStatus.INITIATED]: [TransferStatus.COLLECTING, TransferStatus.FAILED, TransferStatus.CANCELLED],
    [TransferStatus.COLLECTING]: [TransferStatus.FUNDS_RECEIVED, TransferStatus.FAILED],
    [TransferStatus.FUNDS_RECEIVED]: [TransferStatus.CONVERTING, TransferStatus.COMPLETED, TransferStatus.FAILED],
    [TransferStatus.CONVERTING]: [TransferStatus.SENDING, TransferStatus.FAILED],
    [TransferStatus.SENDING]: [TransferStatus.COMPLETED, TransferStatus.FAILED],
    [TransferStatus.FAILED]: [TransferStatus.REFUNDING],
    [TransferStatus.REFUNDING]: [TransferStatus.REFUNDED],
};
function canTransition(from, to) {
    return exports.VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
