-- Institutional accounts consume only the server-side, anonymized monitor.
-- Restrictive policies also cover permissive policies from earlier migrations.
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['patients', 'triage_cases', 'triage_events', 'audit_events'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS institution_projection_only ON public.%I', target);
    EXECUTE format('CREATE POLICY institution_projection_only ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.current_vita_role() <> ''institution'') WITH CHECK (public.current_vita_role() <> ''institution'')', target);
  END LOOP;
END $$;
DROP POLICY IF EXISTS institution_own_profile_only ON public.profiles;
CREATE POLICY institution_own_profile_only ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.current_vita_role() <> 'institution' OR id = auth.uid());
