drop extension if exists "pg_net";

alter table "public"."expenses" enable row level security;

alter table "public"."group_members" enable row level security;

alter table "public"."groups" enable row level security;

alter table "public"."hangout_participants" enable row level security;

alter table "public"."hangout_ratings" enable row level security;

alter table "public"."hangouts" enable row level security;

alter table "public"."notes" enable row level security;

alter table "public"."photos" enable row level security;

alter table "public"."profiles" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."group_members" to "anon";

grant insert on table "public"."group_members" to "anon";

grant select on table "public"."group_members" to "anon";

grant update on table "public"."group_members" to "anon";

grant delete on table "public"."group_members" to "authenticated";

grant insert on table "public"."group_members" to "authenticated";

grant select on table "public"."group_members" to "authenticated";

grant update on table "public"."group_members" to "authenticated";

grant delete on table "public"."group_members" to "service_role";

grant insert on table "public"."group_members" to "service_role";

grant select on table "public"."group_members" to "service_role";

grant update on table "public"."group_members" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";

grant delete on table "public"."hangout_participants" to "anon";

grant insert on table "public"."hangout_participants" to "anon";

grant select on table "public"."hangout_participants" to "anon";

grant update on table "public"."hangout_participants" to "anon";

grant delete on table "public"."hangout_participants" to "authenticated";

grant insert on table "public"."hangout_participants" to "authenticated";

grant select on table "public"."hangout_participants" to "authenticated";

grant update on table "public"."hangout_participants" to "authenticated";

grant delete on table "public"."hangout_participants" to "service_role";

grant insert on table "public"."hangout_participants" to "service_role";

grant select on table "public"."hangout_participants" to "service_role";

grant update on table "public"."hangout_participants" to "service_role";

grant delete on table "public"."hangout_ratings" to "anon";

grant insert on table "public"."hangout_ratings" to "anon";

grant select on table "public"."hangout_ratings" to "anon";

grant update on table "public"."hangout_ratings" to "anon";

grant delete on table "public"."hangout_ratings" to "authenticated";

grant insert on table "public"."hangout_ratings" to "authenticated";

grant select on table "public"."hangout_ratings" to "authenticated";

grant update on table "public"."hangout_ratings" to "authenticated";

grant delete on table "public"."hangout_ratings" to "service_role";

grant insert on table "public"."hangout_ratings" to "service_role";

grant select on table "public"."hangout_ratings" to "service_role";

grant update on table "public"."hangout_ratings" to "service_role";

grant delete on table "public"."hangouts" to "anon";

grant insert on table "public"."hangouts" to "anon";

grant select on table "public"."hangouts" to "anon";

grant update on table "public"."hangouts" to "anon";

grant delete on table "public"."hangouts" to "authenticated";

grant insert on table "public"."hangouts" to "authenticated";

grant select on table "public"."hangouts" to "authenticated";

grant update on table "public"."hangouts" to "authenticated";

grant delete on table "public"."hangouts" to "service_role";

grant insert on table "public"."hangouts" to "service_role";

grant select on table "public"."hangouts" to "service_role";

grant update on table "public"."hangouts" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."photos" to "anon";

grant insert on table "public"."photos" to "anon";

grant select on table "public"."photos" to "anon";

grant update on table "public"."photos" to "anon";

grant delete on table "public"."photos" to "authenticated";

grant insert on table "public"."photos" to "authenticated";

grant select on table "public"."photos" to "authenticated";

grant update on table "public"."photos" to "authenticated";

grant delete on table "public"."photos" to "service_role";

grant insert on table "public"."photos" to "service_role";

grant select on table "public"."photos" to "service_role";

grant update on table "public"."photos" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


