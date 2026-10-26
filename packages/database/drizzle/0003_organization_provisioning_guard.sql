-- The guard at insert time.
--
-- A creation attempt carries its operation id in the organization's
-- metadata, and that metadata is written by the insert itself. This
-- trigger reads the marker out of the row being inserted and checks
-- that the operation it names is still pending.
--
-- The check has to be here, and not only in the application, because
-- the application's check happens before the insert and the insert
-- happens after it. A takeover that lands in between would let a
-- superseded attempt create an organization anyway.
--
-- The row lock is what makes the check atomic with the insert. The
-- trigger locks the operation row it validates, and a takeover that
-- updates that row waits for the lock, so the loser of the race
-- observes the winner's state instead of a stale copy of it.
--
-- The error is raised with the SQLSTATE D0001, a class Postgres
-- reserves for nothing else, so the caller can tell this refusal
-- apart from any other failure.
CREATE OR REPLACE FUNCTION organization_provisioning_guard() RETURNS trigger AS $$
DECLARE
  marker text;
  operation_status text;
BEGIN
  -- Only a row that carries a marker is guarded. An organization
  -- created without one is not the provisioning's business.
  IF NEW.metadata IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    marker := (NEW.metadata::jsonb ->> 'provisioningAttempt');
  EXCEPTION WHEN others THEN
    RETURN NEW;
  END;

  IF marker IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status INTO operation_status
    FROM organization_provisioning
   WHERE id = marker
     FOR UPDATE;

  IF operation_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'the provisioning operation % is not pending', marker
      USING ERRCODE = 'D0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER organization_provisioning_guard
  BEFORE INSERT ON organization
  FOR EACH ROW EXECUTE FUNCTION organization_provisioning_guard();
