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

  it('prefers people.remove and falls back to people_link.remove', async () => {
    const removePeople = jest.fn().mockResolvedValue(null);
    const removePeopleLink = jest.fn();
    await expect(
      removeEmployeeFromCompany({
        peopleId: '80',
        linkId: '201',
        removePeople,
        removePeopleLink,
      }),
    ).resolves.toEqual({mode: 'people', peopleId: '80', linkId: '201'});
    expect(removePeople).toHaveBeenCalledWith('80');
    expect(removePeopleLink).not.toHaveBeenCalled();

    await expect(
      removeEmployeeFromCompany({
        peopleId: '',
        linkId: '201',
        removePeople: undefined,
        removePeopleLink: jest.fn().mockResolvedValue(null),
      }),
    ).resolves.toMatchObject({mode: 'link', linkId: '201'});
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
