#!/bin/bash

OUTPUT=/tmp/`basename ${0}`.${LOGNAME}.output.tmp

source /opt/redash/.env

echo ${REDASH_DATABASE_URL}

USER=`echo ${REDASH_DATABASE_URL} | cut -d':' -f2 | cut -d'/' -f3`
PASSWORD=`echo ${REDASH_DATABASE_URL} | cut -d':' -f3 | cut -d'@' -f1`
HOST=`echo ${REDASH_DATABASE_URL} | cut -d':' -f3 | cut -d'@' -f2`
DATABASE=`echo ${REDASH_DATABASE_URL} | cut -d'/' -f4`
PORT=`echo ${REDASH_DATABASE_URL} | cut -d':' -f4 | cut -d'/' -f1`

export PGUSER=${USER}
export PGPASSWORD=${PASSWORD}

echo "delete from query_results qr where qr.retrieved_at < now()-interval '1 month' and qr.id not in (select q.latest_query_data_id from queries q where q.latest_query_data_id is not null); vacuum analyze verbose query_results;" | psql --host=${HOST} --port=${PORT} ${DATABASE} --no-password --echo-all 1>${OUTPUT} 2>&1

if [ "${?}" != "0" ]
then
	cat ${OUTPUT}
fi

rm ${OUTPUT}
exit 0
