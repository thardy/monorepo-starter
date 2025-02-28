import Joi from 'joi';
import {ServerError, ValidationError} from '../errors/index.js';
import {ObjectId} from 'mongodb';

function handleValidationResult(validationResult: Joi.ValidationResult, methodName: string): void {
  if (validationResult?.error) {
    //console.log(`validation error in ${methodName} - ${JSON.stringify(validationResult)}`);
    throw new ValidationError(validationResult.error);
  }
}

function useFriendlyId(doc: any) {
  if (doc && doc._id) {
    doc.id = doc._id.toHexString();
  }
}

function removeMongoId(doc: any) {
  if (doc && doc._id) {
    delete doc._id;
  }
}

function isValidObjectId(id: any) {
  let result = false;
	if (typeof id === 'string' || id instanceof String) {
  	result = id.match(/^[0-9a-fA-F]{24}$/) ? true : false;
  }
	else {
		console.log(`entityUtils.isValidObjectId called with something other than a string. id = ${id}`);
		console.log(`typeof id = ${typeof id}`);
		console.log('id = ', id);
	}
	return result;
}

// todo: remove 'clientId' from ignoredProperties as soon as I switch all the clientIds over to Mongo ids
function convertForeignKeysToObjectIds(doc: any, ignoredProperties: string[] = ['orgId', 'clientId']) {
	for (const key of Object.keys(doc)) {
		if (!ignoredProperties.includes(key) && key.endsWith('Id') && doc[key]) {
			// Skip if already an ObjectId instance
			if (doc[key] instanceof ObjectId) {
				continue;
			}
			
			const isValid = isValidObjectId(doc[key]);
			if (!isValid) {
				throw new ServerError(`property - ${key}, with value - ${doc[key]} is not a valid ObjectId string in entityUtils.convertForeignKeysToObjectIds`);
			}
			doc[key] = new ObjectId(doc[key]);
		}
	}

	// Object.keys(doc).forEach(key => {
	// 	// consider having a list of properties to leave alone beyond just orgId
	// 	if (!ignoredProperties.includes(key) && key.endsWith('Id') && doc[key]) {
	// 		console.log(`evaluating property ${key} with value ${doc[key]}`); // todo: delete me
	// 		const isValid = isValidObjectId(doc[key]);
	// 		if (!isValid) {
	// 			throw new ServerError(`${key}, (${doc[key]}) is not a valid ObjectId`);
	// 		}
	// 		doc[key] = new ObjectId(doc[key]);
	// 	}
	// });
}

export const entityUtils =  {
  handleValidationResult,
  useFriendlyId,
  removeMongoId,
  isValidObjectId,
	convertForeignKeysToObjectIds,
};
