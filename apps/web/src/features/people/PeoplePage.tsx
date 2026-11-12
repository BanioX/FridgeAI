import type { Id, MemberView } from '@fridgeai/core';
import { CommandError } from '@fridgeai/core';
import { Trash2, UserPlus } from 'lucide-react';
import { useId, useState, type SyntheticEvent } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem, GROUPED_ROW_LINK } from '../../ui/GroupedList';
import { OwnerBadge } from '../../ui/OwnerBadge';
import { useMembers } from './use-members';

const t = messages.people;
const inputClass =
  'min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg outline-none focus:border-basil-600';

/** Why a name was refused, in words. */
function problemOf(error: unknown): string {
  return error instanceof CommandError && error.code === 'duplicate_name' ? t.nameTaken : t.failed;
}

/**
 * «Personen» under «Mehr» (ADR-0058): who is in the household, so food can carry a mark («Gehört
 * Mia»). Only names, no accounts: until Sync exists Rettich runs on one device.
 */
export function PeoplePage() {
  const { householdId, ids, household } = useAppData();
  const members = useMembers();
  const id = useId();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Id | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      setStatus(await action());
    } catch (failure) {
      setError(problemOf(failure));
    } finally {
      setBusy(false);
    }
  }

  const add = (event: SyntheticEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (name === '') {
      setError(t.nameMissing);
      return;
    }
    void run(async () => {
      await household['household.addMember']({
        commandId: ids.next(),
        householdId,
        displayName: name,
      });
      setNewName('');
      return t.added(name);
    });
  };

  function open(member: MemberView) {
    setEditing(member.id);
    setEditName(member.displayName);
    setConfirmingRemove(false);
    setError('');
    setStatus('');
  }

  function close() {
    setEditing(null);
    setConfirmingRemove(false);
    setError('');
  }

  const rename = (member: MemberView, event: SyntheticEvent) => {
    event.preventDefault();
    const name = editName.trim();
    if (name === '') {
      setError(t.nameMissing);
      return;
    }
    void run(async () => {
      await household['household.renameMember']({
        commandId: ids.next(),
        householdId,
        memberId: member.id,
        displayName: name,
      });
      setEditing(null);
      return t.renamed(name);
    });
  };

  const remove = (member: MemberView) =>
    run(async () => {
      await household['household.removeMember']({
        commandId: ids.next(),
        householdId,
        memberId: member.id,
      });
      setEditing(null);
      setConfirmingRemove(false);
      return t.removed(member.displayName);
    });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.pages.people}</h1>
      </div>

      <p className="text-ink-muted">{t.intro}</p>

      {members === undefined ? (
        <p className="sr-only">{messages.loading}</p>
      ) : (
        <section aria-label={t.listLabel}>
          <GroupedList>
            {members.map((member, index) => {
              const isEditing = editing === member.id;
              const removable = member.role !== 'owner' && !member.isSelf;
              return (
                <GroupedListItem key={member.id} inset="icon">
                  {isEditing ? (
                    <form
                      className="space-y-3 p-4"
                      onSubmit={(event) => {
                        rename(member, event);
                      }}
                    >
                      <div className="space-y-1.5">
                        <label htmlFor={`${id}-edit`} className="font-semibold">
                          {t.rename}
                        </label>
                        <input
                          id={`${id}-edit`}
                          value={editName}
                          maxLength={40}
                          autoComplete="off"
                          autoCapitalize="words"
                          onChange={(event) => {
                            setEditName(event.target.value);
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={busy}>
                          {t.save}
                        </Button>
                        <Button variant="secondary" disabled={busy} onClick={close}>
                          {t.cancel}
                        </Button>
                      </div>
                      {removable ? (
                        confirmingRemove ? (
                          <div className="space-y-2 border-t border-line pt-3">
                            <p>{t.removeQuestion(member.displayName)}</p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="danger"
                                icon={Trash2}
                                disabled={busy}
                                onClick={() => {
                                  void remove(member);
                                }}
                              >
                                {t.removeConfirm}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setConfirmingRemove(false);
                                }}
                              >
                                {t.cancel}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => {
                              setConfirmingRemove(true);
                            }}
                          >
                            {t.remove}
                          </Button>
                        )
                      ) : null}
                    </form>
                  ) : (
                    <button
                      type="button"
                      aria-label={t.edit(
                        member.isSelf ? `${member.displayName} ${t.you}` : member.displayName,
                      )}
                      onClick={() => {
                        open(member);
                      }}
                      className={`${GROUPED_ROW_LINK} flex min-h-14 w-full items-center gap-3 py-2 pr-3 pl-4 text-left`}
                    >
                      <OwnerBadge initials={member.initials} index={index} />
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {member.displayName}
                        {member.isSelf ? (
                          <span className="ml-1.5 font-normal text-ink-muted">{t.you}</span>
                        ) : null}
                      </span>
                    </button>
                  )}
                </GroupedListItem>
              );
            })}
          </GroupedList>
        </section>
      )}

      <section aria-labelledby={`${id}-add`} className="space-y-3">
        <h2 id={`${id}-add`} className="font-display text-xl font-semibold">
          {t.add}
        </h2>
        <form noValidate className="space-y-3" onSubmit={add}>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-name`} className="font-semibold">
              {t.name}
            </label>
            <input
              id={`${id}-name`}
              value={newName}
              maxLength={40}
              placeholder={t.namePlaceholder}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              onChange={(event) => {
                setNewName(event.target.value);
              }}
              className={inputClass}
            />
          </div>
          <Button type="submit" icon={UserPlus} fullWidth disabled={busy}>
            {t.add}
          </Button>
        </form>
      </section>

      <p role="status" className="font-semibold text-basil-800 empty:hidden">
        {status}
      </p>
      <p role="alert" className="text-today empty:hidden">
        {error}
      </p>

      <p className="text-sm text-ink-muted">{t.ownerHint}</p>
      <p className="text-sm text-ink-muted">{t.deviceNote}</p>
    </div>
  );
}
