/*
Copyright 2018 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import MatrixClientPeg from '../MatrixClientPeg';
import FuzzyMatcher from './FuzzyMatcher';
import {PillCompletion} from './Components';
import sdk from '../index';
import _sortBy from 'lodash/sortBy';
import {makeGroupPermalink} from "../matrix-to";
import type {Completion, SelectionRange} from "./Autocompleter";
import FlairStore from "../stores/FlairStore";

const COMMUNITY_REGEX = /(?=\+)(\S*)/g;

function score(query, space) {
    const index = space.indexOf(query);
    if (index === -1) {
        return Infinity;
    } else {
        return index;
    }
}

export default class CommunityProvider extends AutocompleteProvider {
    constructor() {
        super(COMMUNITY_REGEX);
        this.matcher = new FuzzyMatcher([], {
            keys: ['groupId', 'name', 'shortDescription'],
        });
    }

    async getCompletions(query: string, selection: SelectionRange, force?: boolean = false): Array<Completion> {
        const BaseAvatar = sdk.getComponent('views.avatars.BaseAvatar');

        // Disable autocompletions when composing commands because of various issues
        // (see https://github.com/vector-im/riot-web/issues/4762)
        if (/^(\/join|\/leave)/.test(query)) {
            return [];
        }

        const cli = MatrixClientPeg.get();
        let completions = [];
        const {command, range} = this.getCurrentCommand(query, selection, force);
        if (command) {
            const joinedGroups = cli.getGroups().filter(({myMembership}) => myMembership === 'join');

            const groups = (await Promise.all(joinedGroups.map(async ({groupId}) => {
                try {
                    return FlairStore.getGroupProfileCached(cli, groupId);
                } catch (e) { // if FlairStore failed, fall back to just groupId
                    return Promise.resolve({
                        name: '',
                        groupId,
                        avatarUrl: '',
                        shortDescription: '',
                    });
                }
            })));

            this.matcher.setObjects(groups);

            const matchedString = command[0];
            completions = this.matcher.match(matchedString);
            completions = _sortBy(completions, [
                (c) => score(matchedString, c.groupId),
                (c) => c.groupId.length,
            ]).map(({avatarUrl, groupId, name}) => ({
                completion: groupId,
                suffix: ' ',
                href: makeGroupPermalink(groupId),
                component: (
                    <PillCompletion initialComponent={
                        <BaseAvatar name={name || groupId}
                                    width={24} height={24}
                                    url={avatarUrl ? cli.mxcUrlToHttp(avatarUrl, 24, 24) : null} />
                    } title={name} description={groupId} />
                ),
                range,
            }))
            .slice(0, 4);
        }
        return completions;
    }

    getName() {
        return '💬 ' + _t('Communities');
    }

    renderCompletions(completions: [React.Component]): ?React.Component {
        return <div className="mx_Autocomplete_Completion_container_pill mx_Autocomplete_Completion_container_truncate">
            { completions }
        </div>;
    }
}
