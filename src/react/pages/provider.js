import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';


const Providers = () => {
  return (
    <People
      context={{
        context: 'provider',
        title: global.t?.t('people', 'title', 'providers'),
        searchPlaceholder: global.t?.t('people', 'searchPlaceholder', 'searchProvider'),
        emptyTitle: global.t?.t('people', 'title', 'emptyProvider'),
        emptySearchTitle: global.t?.t('people', 'title', 'emptySearchProvider'),
        emptySubtitle: global.t?.t('people', 'title', 'addFirstProvider'),
      }}
    />
  );
};

export default Providers;