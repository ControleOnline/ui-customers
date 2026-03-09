import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';


const Clients = () => {
  return (
    <People
      context={{
        linkType: 'client',
        title: 'Clientes',
        searchPlaceholder: 'Buscar cliente...',
        emptyTitle: 'Nenhum cliente',
        emptySearchTitle: 'Nenhum cliente encontrado',
        emptySubtitle: 'Adicione seu primeiro cliente',
      }}
    />
  );
};

export default Clients;