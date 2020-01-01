/* global sauce chrome */

sauce.ns('rpc', function() {
    'use strict';

    function _sendMessage(msg) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(sauce.extID, msg, resp => {
                if (resp === undefined || !resp.success) {
                    const err = resp ? resp.error : 'general error';
                    reject(new Error(err));
                } else {
                    resolve(resp.data);
                }
            });
        });
    }

    async function storageSet(key, value) {
        let data;
        if (value === undefined && typeof key === 'object') {
            data = key;
        } else {
            data = {[key]: value};
        }
        return await _sendMessage({system: 'storage', op: 'set', data});
    }

    async function storageGet(data) {
        return await _sendMessage({system: 'storage', op: 'get', data});
    }

    async function setFTP(athlete, ftp) {
        const data = await storageGet(['athlete_info', 'ftp_overrides']);
        if (!data.athlete_info) {
            data.athlete_info = {};
        }
        if (!data.ftp_overrides) {
            data.ftp_overrides = {};
        }
        data.athlete_info[athlete.id] = {
            name: athlete.get('display_name')
        };
        data.ftp_overrides[athlete.id] = ftp;
        await storageSet(data);
    }

    async function getFTP(athlete_id) {
        const ftps = await storageGet('ftp_overrides');
        return ftps ? ftps[athlete_id] : undefined;
    }

    async function setWeight(athlete, weight) {
        const data = await storageGet(['athlete_info', 'weight_overrides']);
        if (!data.athlete_info) {
            data.athlete_info = {};
        }
        if (!data.weight_overrides) {
            data.weight_overrides = {};
        }
        data.athlete_info[athlete.id] = {
            name: athlete.get('display_name')
        };
        data.weight_overrides[athlete.id] = weight;
        await storageSet(data);
    }

    async function getWeight(athlete_id) {
        const weights = await storageGet('weight_overrides');
        return weights ? weights[athlete_id] : undefined;
    }

    async function ga() {
        const args = Array.from(arguments);
        const meta = {referrer: document.referrer};
        return await _sendMessage({system: 'ga', op: 'apply', data: {meta, args}});
    }

    async function reportEvent(eventCategory, eventAction, eventLabel, options) {
        await sauce.rpc.ga('send', 'event', Object.assign({
            eventCategory,
            eventAction,
            eventLabel,
        }, options));
    }

    async function reportError(e) {
        const page = location.pathname;
        await sauce.rpc.ga('send', 'exception', {
            exDescription: e.message,
            exFatal: true,
            page
        });
        await reportEvent('Error', 'exception', e.message, {nonInteraction: true, page});
    }

    return {
        getFTP,
        setFTP,
        getWeight,
        setWeight,
        storageSet,
        storageGet,
        ga,
        reportEvent,
        reportError,
    };
});
