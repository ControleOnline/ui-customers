const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {describe, expect, it, beforeEach} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

const peopleActions = {
  getMediaTypes: jest.fn(),
  getPeopleMedia: jest.fn(),
  savePeopleMedia: jest.fn(),
  uploadPeopleMedia: jest.fn(),
  deletePeopleMedia: jest.fn(),
  setItem: jest.fn(),
};

const peopleLinkActions = {
  getItems: jest.fn(),
};

const messageActions = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

jest.mock('@store', () => ({
  useStore: jest.fn(name => {
    if (name === 'people') {
      return {
        actions: peopleActions,
        getters: {
          currentCompany: {id: 12},
        },
      };
    }

    if (name === 'people_link') {
      return {
        actions: peopleLinkActions,
        getters: {},
      };
    }

    if (name === 'theme') {
      return {
        getters: {
          colors: {},
        },
      };
    }

    return {actions: {}, getters: {}};
  }),
  useStores: jest.fn(() => ({
    actions: peopleActions,
    getters: {
      currentCompany: {id: 12},
    },
  })),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  ActivityIndicator: props => React.createElement('activityindicator', props, props.children),
  Alert: {
    alert: jest.fn(),
  },
  Keyboard: {
    dismiss: jest.fn(),
  },
  Platform: {OS: 'web'},
  ScrollView: props => React.createElement('scrollview', props, props.children),
  StyleSheet: {
    create: styles => styles,
  },
  Text: props => React.createElement('text', props, props.children),
  TextInput: props => React.createElement('textinput', props, props.children),
  TouchableOpacity: props => React.createElement('touchableopacity', props, props.children),
  View: props => React.createElement('view', props, props.children),
}));

jest.mock('react-native-vector-icons/Feather', () => props =>
  React.createElement('icon', props, props.children),
  {virtual: true},
);

jest.mock('react-native-vector-icons/FontAwesome', () => props =>
  React.createElement('icon', props, props.children),
  {virtual: true},
);

jest.mock('react-native-vector-icons/MaterialIcons', () => props =>
  React.createElement('icon', props, props.children),
  {virtual: true},
);

jest.mock('@react-native-picker/picker', () => ({
  Picker: props => React.createElement('picker', props, props.children),
}), {virtual: true});

jest.mock('@controleonline/ui-common/src/react/components/AnimatedModal', () => props =>
  (props.visible ? React.createElement('modal', props, props.children) : null),
);

jest.mock('@controleonline/ui-common/src/react/components/MessageService', () => ({
  useMessage: () => messageActions,
}));

jest.mock('@controleonline/ui-common/src/react/components/UserAvatar', () => props =>
  React.createElement('avatar', props, props.children),
);

jest.mock('@controleonline/ui-default/src/react/components/upload/DefaultUpload', () => props =>
  React.createElement('defaultupload', props, props.children),
);

jest.mock('@controleonline/ui-default/src/react/components/upload/fileUpload', () => ({
  extractFileId: value => {
    if (!value && value !== 0) return null;
    const raw = typeof value === 'string' ? value : value?.id || value?.['@id'];
    const match = String(raw || '').match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  },
}));

jest.mock('@controleonline/ui-common/src/react/utils/fileUrl', () => ({
  resolveFileImageUrl: () => 'https://example.test/file.png',
}));

const SalesmanTab =
  require('@controleonline/ui-customers/src/react/components/tabs/SalesmanTab').default;
const MediaTab =
  require('@controleonline/ui-customers/src/react/components/tabs/MediaTab').default;
const employeesTabModule =
  require('@controleonline/ui-customers/src/react/components/tabs/EmployeesTab');
const EmployeesTab = employeesTabModule.default;
const {
  formatEmployeeContactMeta,
  formatEmployeeContactTitle,
} = employeesTabModule;

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('people media tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads company icons through the people store on SalesmanTab', async () => {
    peopleLinkActions.getItems.mockResolvedValue([
      {
        id: 1,
        linkType: 'sellers-client',
        people: {id: '/people/12'},
        company: {id: '/people/55', name: 'Companhia 55'},
      },
    ]);
    peopleActions.getPeopleMedia.mockResolvedValue([
      {
        id: 9,
        file: {id: 91, fileName: 'icon.png'},
      },
    ]);

    await renderer.act(async () => {
      renderer.create(
        React.createElement(SalesmanTab, {
          client: {id: 12},
          customStyles: {
            tabContent: {},
            section: {},
            loadingIndicator: {color: '#000'},
            emptyText: {},
            listItem: {},
            listItemWithEndAction: {},
            itemContent: {},
            listAvatarBrand: {backgroundColor: '#fff', borderColor: '#ddd'},
            listAvatarText: {color: '#000'},
            listAvatar: {},
            itemText: {},
            itemSubtext: {},
            iconButtonGhost: {},
            iconButtonGhostIcon: {color: '#000'},
          },
          linkType: 'sellers-client',
          emptyText: 'empty',
          errorText: 'error',
        }),
      );
      await flush();
    });

    expect(peopleActions.getPeopleMedia).toHaveBeenCalledWith({
      people: '/people/55',
      'mediaType.type': 'icon',
      itemsPerPage: 1,
    });
  });

  it('loads avatars through the people store on EmployeesTab', async () => {
    peopleLinkActions.getItems.mockResolvedValue([
      {
        id: 2,
        linkType: 'employee',
        people: {id: '/people/77', peopleType: 'F'},
        company: {id: '/people/12'},
      },
    ]);
    peopleActions.getPeopleMedia.mockResolvedValue([
      {
        id: 10,
        file: {id: 101, fileName: 'avatar.png'},
      },
    ]);

    await renderer.act(async () => {
      renderer.create(
        React.createElement(EmployeesTab, {
          client: {id: 12},
          customStyles: {
            tabContent: {},
            section: {},
            sectionHeader: {},
            sectionTitle: {},
            iconButtonPrimary: {},
            iconButtonPrimaryIcon: {color: '#000'},
            loadingIndicator: {color: '#000'},
            emptyText: {},
            txt_title_emptyText: {},
            listItem: {},
            listItemWithEndAction: {},
            itemContent: {},
            listAvatarBrand: {backgroundColor: '#fff', borderColor: '#ddd'},
            listAvatarText: {color: '#000'},
            listAvatar: {},
            itemText: {},
            itemSubtext: {},
            iconButtonGhost: {},
            iconButtonGhostIcon: {color: '#000'},
            saveButton: {},
            saveButtonDisabled: {},
            saveButtonText: {color: '#000'},
          },
        }),
      );
      await flush();
    });

    expect(peopleActions.getPeopleMedia).toHaveBeenCalledWith({
      people: '/people/77',
      'mediaType.type': 'avatar',
      itemsPerPage: 1,
    });
  });

  it('formats contact rows as name alias and id link type', () => {
    const contact = {
      id: '/people/77',
      name: 'Maria Silva',
      alias: 'Mari',
      linkType: 'employee',
      peopleLink: {
        linkType: 'owner',
      },
    };

    expect(formatEmployeeContactTitle(contact)).toBe('Maria Silva / Mari');
    expect(formatEmployeeContactMeta(contact)).toBe('ID: 77 / owner');
  });

  it('uses the generic upload flow before saving client JPG/PNG media', async () => {
    peopleActions.getMediaTypes.mockResolvedValue([
      {
        id: 12,
        '@id': '/media_types/12',
        type: 'icon',
        peopleType: 'J',
      },
    ]);
    peopleActions.getPeopleMedia.mockResolvedValue([]);
    peopleActions.savePeopleMedia.mockResolvedValue({id: 130});

    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(MediaTab, {
          client: {
            id: 11,
            '@id': '/people/11',
            peopleType: 'J',
          },
        }),
      );
      await flush();
    });

    const upload = tree.root.findByType('defaultupload');

    expect(upload.props.acceptedTypes).toBe('image/png,image/jpeg,.png,.jpg,.jpeg');
    expect(upload.props.onUploadFile).toBeUndefined();
    expect(upload.props.uploadResultAlreadyAttached).toBeUndefined();

    await renderer.act(async () => {
      await upload.props.onAttachFile({id: 77, name: 'cliente.jpg'});
    });

    expect(peopleActions.savePeopleMedia).toHaveBeenCalledWith({
      id: undefined,
      people: '/people/11',
      mediaType: '/media_types/12',
      file: '/files/77',
    });
    expect(peopleActions.uploadPeopleMedia).not.toHaveBeenCalled();
  });
});
