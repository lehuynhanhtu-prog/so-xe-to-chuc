// Only pure, synchronous business rules are exported to the Apps Script runtime.
export {transaction,projection} from '../web/service.mjs';
export {assignVehicle,mutateHandover,rebuildAssignments} from '../web/handovers.mjs';
export {normalizeUsername,validateUsername} from '../web/identity.mjs';
export {attachmentStem,attachmentToday,uniqueAttachmentName} from '../web/attachment-names.mjs';
