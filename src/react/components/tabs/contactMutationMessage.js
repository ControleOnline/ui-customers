import {resolveSystemErrorMessage} from '@controleonline/ui-common/src/react/utils/systemErrorMessage'

const PEOPLE_ITEM_NOT_FOUND_PATTERN = /Item not found for "\/people\/\d+"\./i

export const resolveContactMutationMessage = (
  error,
  fallbackMessage = 'Nao foi possivel salvar este contato agora.',
) => {
  const message = resolveSystemErrorMessage(error)

  if (PEOPLE_ITEM_NOT_FOUND_PATTERN.test(message)) {
    return 'Este contato esta vinculado a empresa, mas o cadastro direto dele nao esta disponivel para edicao no momento.'
  }

  return message || fallbackMessage
}

export default resolveContactMutationMessage
