#!/bin/bash

STEP_IN_SECONDS=2

TMP_FILE_PREFIX=`basename ${0}`.${LOGNAME}.
TMP_FILE_1=/tmp/${TMP_FILE_PREFIX}$$.1.tmp

STATS_PER_STEP=/tmp/${TMP_FILE_PREFIX}stats.step
STATS_PER_MINUTE=/tmp/${TMP_FILE_PREFIX}stats.minute


PID_FILE=/tmp/`basename ${0}`.${LOGNAME}.pid

PID=`cat ${PID_FILE} 2>/dev/null`

if [ ! -z "${PID}" ]
then
	if ps -o pid -e | grep -q -w ${PID}
	then
		exit 0
	fi
fi

echo ${$} > ${PID_FILE}




EM=`date +%H:%M`
EH=`echo ${EM} | cut -d':' -f1`
EYMD=`date +%Y-%m-%d`

find /tmp -name "${TMP_FILE_PREFIX}*.tmp" -type f -mtime +7 -delete

cat /dev/null > ${STATS_PER_STEP}

while true
do
	SM=${EM}
	SH=${EH}
	SYMD=${EYMD}

	ps -o etime,rsz,cmd -e | grep 'running query' | grep -v grep | tr -s ' ' | sed 's/^ //' | cut -d' ' -f1,2 > ${TMP_FILE_1}
	#ps -o etime,rsz,cmd -e | grep 'zabbix' | grep -v grep | tr -s ' ' | sed 's/^ //' | cut -d' ' -f1,2 > ${TMP_FILE_1}
	BUSY_WORKERS=`cat ${TMP_FILE_1} | wc -l`

	#cat ${TMP_FILE_1}

	#things running for more than a day
	LONGEST_RUNNING_TIME=`cat ${TMP_FILE_1} | grep '-' | sort -nr | cut -d' ' -f1 | head -n 1`

	D=0
	H=0
	M=0
	S=0

	if [ ! -z "${LONGEST_RUNNING_TIME}" ]
	then
			#echo max=d+
		D=`echo ${LONGEST_RUNNING_TIME} | cut -d'-' -f1`
		H=`echo ${LONGEST_RUNNING_TIME} | cut -d'-' -f2 | cut -d':' -f1 | sed 's/^0//'`
		M=`echo ${LONGEST_RUNNING_TIME} | cut -d'-' -f2 | cut -d':' -f2 | sed 's/^0//'`
		S=`echo ${LONGEST_RUNNING_TIME} | cut -d'-' -f2 | cut -d':' -f3 | sed 's/^0//'`

	else
		#things running for more than an hour
		LONGEST_RUNNING_TIME=`cat ${TMP_FILE_1} | grep -e '.*:.*:' | sort -nr | cut -d' ' -f1 | head -n 1`
		if [ ! -z "${LONGEST_RUNNING_TIME}" ]
		then
			#echo max=h+
			H=`echo ${LONGEST_RUNNING_TIME} | cut -d':' -f1 | sed 's/^0//'`
			M=`echo ${LONGEST_RUNNING_TIME} | cut -d':' -f2 | sed 's/^0//'`
			S=`echo ${LONGEST_RUNNING_TIME} | cut -d':' -f3 | sed 's/^0//'`
		else
			LONGEST_RUNNING_TIME=`cat ${TMP_FILE_1} | sort -nr | cut -d' ' -f1 | head -n 1`
			#echo max=h-
			M=`echo ${LONGEST_RUNNING_TIME} | cut -d':' -f1 | sed 's/^0//'`
			S=`echo ${LONGEST_RUNNING_TIME} | cut -d':' -f2 | sed 's/^0//'`
		fi
	fi

	LONGEST_RUNNING_TIME_IN_SECS=$((D*86400 + H*3600 + M*60 + S))

	#echo d=${D}:h=${H}:m=${M}:s=${S}:

	BIGGEST_RSZ=`cat ${TMP_FILE_1} | cut -d' ' -f2 | sort -rn | head -n 1`

	sleep ${STEP_IN_SECONDS}
	
	EM=`date +%H:%M`
	EH=`echo ${EM} | cut -d':' -f1`
	EYMD=`date +%Y-%m-%d`

	if [ "${SM}" != "${EM}" ]
	then
		#echo minute has changed - generate stats per minute

		M_LEAST_BUSY_WORKERS=`cat ${STATS_PER_STEP} | cut -d';' -f2 | sort -n | head -n 1`
		M_BIGGEST_RSZ=`cat ${STATS_PER_STEP} | cut -d';' -f3 | sort -nr | head -n 1`
		M_LONGEST_RUNNER=`cat ${STATS_PER_STEP} | cut -d';' -f4 | sort -nr | head -n 1`

		#echo "${SM};${M_LEAST_BUSY_WORKERS};${M_BIGGEST_RSZ};${M_LONGEST_RUNNER}" 
		echo "${SM};${M_LEAST_BUSY_WORKERS};${M_BIGGEST_RSZ};${M_LONGEST_RUNNER}" >> ${STATS_PER_MINUTE}

		cat /dev/null > ${STATS_PER_STEP}

		if [ "${SH}" != "${EH}" ]
		then

			STATS_PER_HOUR=/tmp/${TMP_FILE_PREFIX}stats.${SYMD}.hour.tmp

			#echo hour has changed - generate stats per  hour

			H_LEAST_BUSY_WORKERS=`cat ${STATS_PER_MINUTE} | cut -d';' -f2 | sort -n | head -n 1`
			H_BIGGEST_RSZ=`cat ${STATS_PER_MINUTE} | cut -d';' -f3 | sort -nr | head -n 1`
			H_LONGEST_RUNNER=`cat ${STATS_PER_MINUTE} | cut -d';' -f4 | sort -nr | head -n 1`

			#echo "${SH};${H_LEAST_BUSY_WORKERS};${H_BIGGEST_RSZ};${H_LONGEST_RUNNER}" 
			echo "${SH};${H_LEAST_BUSY_WORKERS};${H_BIGGEST_RSZ};${H_LONGEST_RUNNER}" >> ${STATS_PER_HOUR}

			cat /dev/null > ${STATS_PER_MINUTE}
		fi
	fi

	#/bin/echo -e "`date +%H:%M:%S`;${BUSY_WORKERS};${BIGGEST_RSZ};${LONGEST_RUNNING_TIME_IN_SECS}"
	/bin/echo -e "`date +%H:%M:%S`;${BUSY_WORKERS};${BIGGEST_RSZ};${LONGEST_RUNNING_TIME_IN_SECS}" >> ${STATS_PER_STEP}

done


