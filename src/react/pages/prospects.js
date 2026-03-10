import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';


const Prospects = () => {
  return (
    <People
      context={{
        context: 'prospect',
        title: 'Prospects',
        searchPlaceholder: 'Buscar prospect...',
        emptyTitle: 'Nenhum prospect',
        emptySearchTitle: 'Nenhum prospect encontrado',
        emptySubtitle: 'Adicione seu primeiro prospect',
      }}
    />
  );
};

export default Prospects;