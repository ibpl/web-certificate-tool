// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { isAppError, convertToAppError } from './index';

// Check error routines.
describe('errors', () => {
	test('isAppError recognizes valid App.Error', () => {
		expect(isAppError(<App.Error>{ status: 200, message: 'test' })).toBeTruthy();
	});

	test('isAppError recognizes invalid App.Error', () => {
		expect(isAppError(1)).toBeFalsy();
		expect(isAppError({ status: 200, message: 1 })).toBeFalsy();
		expect(isAppError({ status: '200', message: 'test' })).toBeFalsy();
	});

	test('convertToAppError converts string', () => {
		expect(isAppError(convertToAppError('test'))).toBeTruthy();
		expect(convertToAppError('test')).toEqual(<App.Error>{ status: 418, message: 'test' });
	});

	test('convertToAppError converts Error', () => {
		expect(isAppError(convertToAppError(Error('test')))).toBeTruthy();
		expect(convertToAppError(Error('test'))).toEqual(<App.Error>{ status: 418, message: 'test' });
	});

	test('convertToAppError converts App.Error', () => {
		expect(convertToAppError(<App.Error>{ status: 200, message: 'test' })).toEqual(<App.Error>{
			status: 200,
			message: 'test'
		});
		expect(convertToAppError(<App.Error>{ status: 200, message: 'test' }, 'testop')).toEqual(<
			App.Error
		>{ status: 200, message: 'test', operation: 'testop' });
	});

	test('convertToAppError converts string with standard error message', () => {
		expect(convertToAppError('testerr', 'testop', 'std msg')).toEqual(<App.Error>{
			status: 418,
			message: 'std msg',
			details: 'testerr',
			operation: 'testop'
		});
	});
});
