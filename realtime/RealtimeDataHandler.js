function RealtimeDataHandler() {
    var oidUUID = '06841c63-ebce-4b6f-a2fc-8fd4ed0776ce';
    var typeUUID = '7d92c78a-8273-4784-99c5-c9187dc4fe8c';

    var subscriptions = {};
    var eventTrigger = $('body');

    var wsapiAggregator = new WSAPIAggregator(eventTrigger);

    this.handleRealtimeMessage = function(data) {
        // do we have enough information to act on this
        if (data && data.type == 'event' && data.data && data.data.action) {
            var offset, valueOffset;
            if (data.data.state && data.data.state[typeUUID]) {
                offset = 'state';
                valueOffset = 'value';
            } else if (data.data.changes && data.data.changes[typeUUID]) {
                offset = 'changes';
                valueOffset = 'old_value';
            }

            var changed = _.uniq(_.pluck(data.data.changes, 'name'));
            
            // if the event was recycling the item, then you will not get any info back from wsapi
            if (data.data.action == 'Recycled') {
                eventTrigger.trigger(data.data[offset][typeUUID][valueOffset] + "-" + data.data.action,
                    {
                        record: null,
                        oid: data.data[offset][oidUUID][valueOffset],
                        changes: null,
                        date: new Date()
                    }
                );
            } else {
                // query wsapi for more information
                wsapiAggregator.getWorkItem(data.data[offset][oidUUID][valueOffset], data.data[offset][typeUUID][valueOffset], function(record) {
                    eventTrigger.trigger(data.data[offset][typeUUID][valueOffset] + "-" + data.data.action,
                        {
                            record: record,
                            oid: data.data[offset][oidUUID][valueOffset],
                            changes: changed,
                            date: new Date()
                        }
                    );
                });
            }
        } else if (data.status) {
            eventTrigger.trigger('RealtimeConnection-Status', {status: data.status, date: new Date()});
        } else {
            eventTrigger.trigger('RealtimeConnection-Other', {data: data, date: new Date()});
        }
    };

    this.setEventTrigger = function(el) {
        if (el && typeof el === 'string') {
            eventTrigger = $(el);
        }
    };
}
