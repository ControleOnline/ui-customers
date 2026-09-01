import {
  extractEmployeeUnlinkIds,
  filterEmployeesAfterUnlink,
  removeEmployeeFromCompany,
  confirmEmployeeRemoval,
  EMPLOYEE_UNLINK_MESSAGE,
} from '../../../../react/components/tabs/employeeUnlink';

describe('employeeUnlink', () => {
  it('extracts people and people_link ids', () => {
    expect(
      extractEmployeeUnlinkIds({
        id: '/people/80',
        peopleLinkId: '/people_links/201',
      }),
    ).toEqual({peopleId: '80', linkId: '201'});
  });

  it('prefers people_link.remove and falls back to people.remove', async () => {
    const removePeople = jest.fn();
    const removePeopleLink = jest.fn().mockResolvedValue(null);
    await expect(
      removeEmployeeFromCompany({
        peopleId: '80',
        linkId: '201',
        removePeople,
        removePeopleLink,
      }),
    ).resolves.toEqual({mode: 'link', peopleId: '80', linkId: '201'});
    expect(removePeopleLink).toHaveBeenCalledWith('201');
    expect(removePeople).not.toHaveBeenCalled();

    await expect(
      removeEmployeeFromCompany({
        peopleId: '80',
        linkId: '',
        removePeople: jest.fn().mockResolvedValue(null),
        removePeopleLink: undefined,
      }),
    ).resolves.toMatchObject({mode: 'people', peopleId: '80'});
  });

  it('filters the local list after unlink', () => {
    const next = filterEmployeesAfterUnlink(
      [
        {id: 80, peopleLink: {id: 201}},
        {id: 81, peopleLink: {id: 202}},
      ],
      {peopleId: '80', linkId: '201'},
    );
    expect(next.map(item => item.id)).toEqual([81]);
  });

  it('uses MessageService dialog when available', () => {
    const showDialog = jest.fn();
    const onConfirm = jest.fn();
    confirmEmployeeRemoval({showDialog, onConfirm});
    expect(showDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Remover colaborador',
        message: EMPLOYEE_UNLINK_MESSAGE,
        confirmLabel: 'Remover',
        onConfirm,
      }),
    );
  });
});
