import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';


const Prospects = () => {
  return (
    <People
      context={{
        context: 'prospect',
        title: global.t?.t('people', 'title', 'prospects'),
        searchPlaceholder: global.t?.t('people', 'searchPlaceholder', 'searchProspect'),
        modalTitle: 'Cadastro de Prospect',
        emptyTitle: global.t?.t('people', 'title', 'emptyProspect'),
        emptySearchTitle: global.t?.t('people', 'title', 'emptySearchProspect'),
        emptySubtitle: global.t?.t('people', 'title', 'addFirstProspect'),
      }}
    />
  );
};

export default Prospects;
