$(document).ready(function() {
    $('.unselected').click(function() {
        $(this).parent().find('.selected').removeClass('selected').addClass('unselected');
        $(this).removeClass('unselected').addClass('selected');
        console.log($(this).text());
        if ($(this).text() === "History") {
            $('#historyLog').show();
            $('#realtimeLog').hide();
        } else {
            $('#realtimeLog').show();
            $('#historyLog').hide();
        }

        $('.unselected').click(function() {
            $(this).parent().find('.selected').removeClass('selected').addClass('unselected');
            $(this).removeClass('unselected').addClass('selected');
            if ($(this).text() === "History") {
                $('#historyLog').show();
                $('#realtimeLog').hide();
            } else {
                $('#realtimeLog').show();
                $('#historyLog').hide();
            }
        });
    });
});
