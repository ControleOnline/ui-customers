import * as actions from '@controleonline/ui-default/src/store/default/actions';
import * as getters from '@controleonline/ui-default/src/store/default/getters';
import mutations from '@controleonline/ui-default/src/store/default/mutations';

/**
 * Store for PeopleCategory join (person ↔ category with timeline).
 * Endpoint: people_categories (api-platform-people).
 * Contexts: profession, position (PF); sector, activity_branch (PJ).
 */
export default {
  namespaced: true,
  state: {
    item: {},
    items: [],
    filters: {},
    resourceEndpoint: 'people_categories',
    isLoading: false,
    error: '',
    totalItems: 0,
    messages: [],
    message: {},
    summary: {},
    columns: [
      {
        editable: false,
        isIdentity: true,
        sortable: true,
        name: 'id',
        align: 'left',
        label: 'id',
        format: value => '#' + value,
      },
      {
        sortable: true,
        name: 'category',
        align: 'left',
        label: 'category',
        format: value => (value && (value.name || value)) || '',
      },
      {
        sortable: true,
        name: 'startDate',
        align: 'left',
        label: 'startDate',
        inputType: 'date',
      },
      {
        sortable: true,
        name: 'endDate',
        align: 'left',
        label: 'endDate',
        inputType: 'date',
      },
      {
        sortable: false,
        name: 'peopleCompany',
        align: 'left',
        label: 'peopleCompany',
        format: value => (value && (value.name || value.id || value)) || '',
      },
    ],
  },
  actions: {
    ...actions,
  },
  getters: {
    ...getters,
  },
  mutations: {
    ...mutations,
  },
};
