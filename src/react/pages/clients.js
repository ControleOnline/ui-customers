import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';


const Clients = () => {
  return (
    <People
      context={{
        context: 'client',
        title: global.t?.t('people', 'title', 'clients'),
        searchPlaceholder: global.t?.t('people', 'searchPlaceholder', 'searchClient'),
        emptyTitle: global.t?.t('people', 'title', 'emptyClient'),
        emptySearchTitle: global.t?.t('people', 'title', 'emptySearchClient'),
        emptySubtitle: global.t?.t('people', 'title', 'addFirstClient'),
      }}
    />
  );
};

export default Clients;