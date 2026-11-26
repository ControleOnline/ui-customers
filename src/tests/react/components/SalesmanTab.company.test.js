const React = require('react');
const renderer = require('react-test-renderer');
const {describe, expect, it, jest} = require('@jest/globals');
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('react-native', () => ({View: 'View', Text: 'Text', TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity', ActivityIndicator: 'ActivityIndicator'}));
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({})}));
jest.mock('@store', () => ({useStore: jest.fn()}));
jest.mock('@controleonline/ui-people/src/react/components/PeopleAvatar', () => 'Avatar');
jest.mock('@controleonline/ui-common/src/react/components/MessageService', () => ({useMessage: () => ({})}));
jest.mock('../../../react/components/tabs/SalesmanManageModal', () => 'Modal');
jest.mock('../../../react/components/tabs/SalesmanCommissionBlock', () => 'Commission');
jest.mock('../../../react/components/tabs/salesmanTabSession', () => ({
  resolveAppType: () => 'MANAGER', resolveSessionUser: () => null,
}));
jest.mock('../../../react/components/tabs/useSalesmanManage', () => ({
  useSalesmanManage: jest.fn(() => ({canManage: false, linkedNormalized: []})),
}));
const {useStore} = require('@store');
const {useSalesmanManage} = require('../../../react/components/tabs/useSalesmanManage');
const SalesmanTab = require('../../../react/components/tabs/SalesmanTab').default;
describe('salesman company context', () => {
  it.each([
    [{id: 2}, '2'],
    [{'@id': '/people/3'}, '3'],
    [{}, '1'],
  ])('preserves selected-company priority for %j', (currentCompany, expected) => {
    useStore.mockImplementation(name => name === 'people'
      ? {getters: {mainCompany: {id: 1}, currentCompany}, actions: {}}
      : {getters: {}, actions: {}});
    let tree;
    renderer.act(() => {
      tree = renderer.create(React.createElement(SalesmanTab, {customStyles: {}}));
    });
    expect(useSalesmanManage.mock.calls.at(-1)[0].currentCompanyId).toBe(expected);
    renderer.act(() => tree.unmount());
  });
});
