import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false })
try {
  const snapshot = {
    schemas: await sql`
      select n.nspname, pg_get_userbyid(n.nspowner) as owner, n.nspacl::text as acl,
             obj_description(n.oid, 'pg_namespace') as comment
      from pg_namespace n
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by n.nspname
    `,
    classes: await sql`
      select n.nspname as schema, c.relname, c.relkind, c.relpersistence, c.relrowsecurity, c.relforcerowsecurity,
             c.reloptions, c.relacl::text as acl, pg_get_userbyid(c.relowner) as owner,
             obj_description(c.oid, 'pg_class') as comment
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
        and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f', 'i', 'I')
      order by n.nspname, c.relkind, c.relname
    `,
    columns: await sql`
      select n.nspname as schema, c.relname as relation, a.attnum, a.attname, format_type(a.atttypid, a.atttypmod) as data_type,
             a.attnotnull, pg_get_expr(d.adbin, d.adrelid) as default_expression,
             a.attidentity, a.attgenerated, coll.collname as collation
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      left join pg_collation coll on coll.oid = a.attcollation and a.attcollation <> 0
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
        and c.relkind in ('r', 'p', 'v', 'm', 'f')
        and a.attnum > 0 and not a.attisdropped
      order by n.nspname, c.relname, a.attnum
    `,
    indexes: await sql`
      select n.nspname as schema, table_class.relname as relation, index_class.relname as name,
             i.indisunique, i.indisprimary, i.indisvalid, i.indisready, pg_get_indexdef(i.indexrelid) as definition
      from pg_index i
      join pg_class table_class on table_class.oid = i.indrelid
      join pg_class index_class on index_class.oid = i.indexrelid
      join pg_namespace n on n.oid = table_class.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by n.nspname, table_class.relname, index_class.relname
    `,
    constraints: await sql`
      select coalesce(relation_ns.nspname, type_ns.nspname) as schema,
             coalesce(relation.relname, type.typname) as relation, constraint_row.conname,
             constraint_row.contype, constraint_row.convalidated, constraint_row.condeferrable,
             constraint_row.condeferred, pg_get_constraintdef(constraint_row.oid, true) as definition
      from pg_constraint constraint_row
      left join pg_class relation on relation.oid = constraint_row.conrelid
      left join pg_type type on type.oid = constraint_row.contypid
      left join pg_namespace relation_ns on relation_ns.oid = relation.relnamespace
      left join pg_namespace type_ns on type_ns.oid = type.typnamespace
      where (relation_ns.nspname <> 'information_schema' and relation_ns.nspname !~ '^pg_')
         or (type_ns.nspname <> 'information_schema' and type_ns.nspname !~ '^pg_')
      order by schema, relation, constraint_row.conname
    `,
    sequences: await sql`
      select n.nspname as schema, c.relname, format_type(s.seqtypid, null) as data_type, s.seqstart, s.seqincrement,
             s.seqmax, s.seqmin, s.seqcache, s.seqcycle
      from pg_sequence s
      join pg_class c on c.oid = s.seqrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by c.relname
    `,
    types: await sql`
      select n.nspname as schema, t.typname, t.typtype, t.typnotnull, t.typdefault,
             format_type(t.typbasetype, null) as base_type
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
        and t.typtype in ('c', 'd', 'e', 'r', 'm')
      order by t.typname
    `,
    enumLabels: await sql`
      select n.nspname as schema, t.typname, e.enumsortorder, e.enumlabel
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by t.typname, e.enumsortorder
    `,
    views: await sql`
      select n.nspname as schema, c.relname, pg_get_viewdef(c.oid, true) as definition
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
        and c.relkind in ('v', 'm')
      order by c.relname
    `,
    triggers: await sql`
      select n.nspname as schema, relation.relname as relation, trigger_row.tgname,
             pg_get_triggerdef(trigger_row.oid, true) as definition
      from pg_trigger trigger_row
      join pg_class relation on relation.oid = trigger_row.tgrelid
      join pg_namespace n on n.oid = relation.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
        and not trigger_row.tgisinternal
      order by n.nspname, relation.relname, trigger_row.tgname
    `,
    routines: await sql`
      select n.nspname as schema, procedure.proname, procedure.prokind,
             pg_get_function_identity_arguments(procedure.oid) as arguments,
             pg_get_functiondef(procedure.oid) as definition
      from pg_proc procedure
      join pg_namespace n on n.oid = procedure.pronamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by n.nspname, procedure.proname, arguments
    `,
    extensions: await sql`
      select extension.extname, extension.extversion, namespace.nspname as schema
      from pg_extension extension
      join pg_namespace namespace on namespace.oid = extension.extnamespace
      where namespace.nspname <> 'information_schema' and namespace.nspname !~ '^pg_'
      order by extension.extname
    `,
    policies: await sql`
      select n.nspname as schema, relation.relname, policy.polname, policy.polcmd, policy.polpermissive,
             pg_get_expr(policy.polqual, policy.polrelid) as using_expression,
             pg_get_expr(policy.polwithcheck, policy.polrelid) as check_expression
      from pg_policy policy
      join pg_class relation on relation.oid = policy.polrelid
      join pg_namespace n on n.oid = relation.relnamespace
      where n.nspname <> 'information_schema' and n.nspname !~ '^pg_'
      order by n.nspname, relation.relname, policy.polname
    `,
  }
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`)
} finally {
  await sql.end()
}
