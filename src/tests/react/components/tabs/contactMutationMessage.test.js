const {describe, expect, it} = global

const {
  resolveContactMutationMessage,
} = require('../../../../react/components/tabs/contactMutationMessage')

describe('contactMutationMessage', () => {
  it('hides raw people iri errors behind a readable contact message', () => {
    expect(
      resolveContactMutationMessage({
        message: 'Item not found for "/people/30".',
      }),
    ).toBe(
      'Este contato esta vinculado a empresa, mas o cadastro direto dele nao esta disponivel para edicao no momento.',
    )
  })

  it('keeps other backend messages when they are already readable', () => {
    expect(
      resolveContactMutationMessage({
        detail: 'Telefone ja cadastrado para outra pessoa.',
      }),
    ).toBe('Telefone ja cadastrado para outra pessoa.')
  })
})
