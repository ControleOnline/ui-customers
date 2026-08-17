import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';

const Clients = () => {
  return (
    <People
      context={{
        context: ['client', 'prospect'],
        defaultContext: 'client',
        // Keep the index independent from optional remote media. Broken/stale
        // avatar files must not generate 404 requests while browsing clients.
        usePeopleImage: false,
        title: global.t?.t('people', 'title', 'clients'),
        searchPlaceholder: global.t?.t('people', 'searchPlaceholder', 'searchClient'),
        modalTitleByType: {
          client: global.t?.t('people', 'title', 'registerClient'),
          prospect: global.t?.t('people', 'title', 'registerProspect'),
        },
        emptyTitle: global.t?.t('people', 'title', 'emptyClient'),
        emptySearchTitle: global.t?.t('people', 'title', 'emptySearchClient'),
        emptySubtitle: global.t?.t('people', 'title', 'addFirstClient'),
      }}
    />
  );
};

export default Clients;
