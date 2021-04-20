$(document).ready(function () {
    const employeeRef = db.collection("hospitals");
    let deleteIDs = [];
    let lastVisibleEmployeeSnapShot = {};

    // GET TOTAL SIZE
    employeeRef.onSnapshot(snapshot => {
        let size = snapshot.size;
        $('.count').text(size);
        if (size == 0) {
            $('#selectAll').attr('disabled', true);
        } else {
            $('#selectAll').attr('disabled', false);
        }
    });


    // REAL TIME LISTENER
    employeeRef.limit(5000).onSnapshot(snapshot => {
        let changes = snapshot.docChanges();
        changes.forEach(change => {
            if (change.type == 'added') {
                renderEmployee(change.doc);
            } else if (change.type == 'modified') {
                $('tr[data-id=' + change.doc.id + ']').remove();
                renderEmployee(change.doc);
            } else if (change.type == 'removed') {
                $('tr[data-id=' + change.doc.id + ']').remove();
            }
        });
        lastVisibleEmployeeSnapShot = snapshot.docs[snapshot.docs.length - 1];
    });

    // db.collection('employees').startAt("abc").endAt("abc\uf8ff").get()
    // .then(function (documentSnapshots) {
    //     documentSnapshots.docs.forEach(doc => {
    //         renderEmployee(doc);
    //     });
    // });

    // db.collection('employees').startAt('bos').endAt('bos\uf8ff').on("value", function(snapshot) {
    //     console.log(snapshot);
    // });

    // var first = db.collection("employees")
    //     .limit(3);

    // first.get().then(function (documentSnapshots) {
    //     documentSnapshots.docs.forEach(doc => {
    //         renderEmployee(doc);
    //     });
    //     lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    // });

    // DISPLAY
    function renderEmployee(document) {
        let item = `<tr data-id="${document.id}">
        <td>
            <span class="custom-checkbox">
                <input type="checkbox" id="${document.id}" name="options[]" value="${document.id}">
                <label for="${document.id}"></label>
            </span>
        </td>
        <td>${document.data().name}</td>
        <td>${document.data().area}</td>
        <td>${document.data().phone}</td>
        <td>${document.data().beds}</td>
        <td>
            <a href="#" id="${document.id}" class="edit js-edit-employee"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
            </a>
            <a href="#" id="${document.id}" class="delete js-delete-employee"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
            </a>
        </td>
    </tr>`;
        $('#employee-table').append(item);
        // Activate tooltip
        $('[data-toggle="tooltip"]').tooltip();
        // Select/Deselect checkboxes
        var checkbox = $('table tbody input[type="checkbox"]');
        $("#selectAll").click(function () {
            if (this.checked) {
                checkbox.each(function () {
                    console.log(this.id);
                    deleteIDs.push(this.id);
                    this.checked = true;
                });
            } else {
                checkbox.each(function () {
                    this.checked = false;
                });
            }
        });
        checkbox.click(function () {
            if (!this.checked) {
                $("#selectAll").prop("checked", false);
            }
        });
    }

    // ADD EMPLOYEE
    $("#add-employee-form").submit(function (event) {
        event.preventDefault();
        db.collection('hospitals').add({
                name: $('#hospname').val(),
                area: $('#hosparea').val(),
                phone: $('#hospphone').val(),
                beds: $('#hospbeds').val()
            }).then(function () {
                console.log("Document successfully written!");
                $("#addEmployeeModal").modal('hide');
            })
            .catch(function (error) {
                console.error("Error writing document: ", error);
            });
    });

    // DELETE EMPLOYEE
    $(document).on('click', '.js-delete-employee', function () {
        let id = $(this).attr('id');
        $('#delete-employee-form').attr('delete-id', id);
        $('#deleteEmployeeModal').modal('show');
    });

    $("#delete-employee-form").submit(function (event) {
        event.preventDefault();
        let id = $(this).attr('delete-id');
        if (id != undefined) {
            db.collection('hospitals').doc(id).delete()
                .then(function () {
                    console.log("Document successfully delete!");
                    $("#deleteEmployeeModal").modal('hide');
                })
                .catch(function (error) {
                    console.error("Error deleting document: ", error);
                });
        } else {
            let checkbox = $('table tbody input:checked');
            checkbox.each(function () {
                db.collection('hospitals').doc(this.value).delete()
                    .then(function () {
                        console.log("Document successfully delete!");
                    })
                    .catch(function (error) {
                        console.error("Error deleting document: ", error);
                    });
            });
            $("#deleteEmployeeModal").modal('hide');
        }
    });

    // UPDATE EMPLOYEE
    $(document).on('click', '.js-edit-employee', function () {
        let id = $(this).attr('id');
        $('#edit-employee-form').attr('edit-id', id);
        db.collection('hospitals').doc(id).get().then(function (document) {
            if (document.exists) {
                $('#edit-employee-form #hospname').val(document.data().name);
                $('#edit-employee-form #hosparea').val(document.data().area);
                $('#edit-employee-form #hospphone').val(document.data().phone);
                $('#edit-employee-form #hospbeds').val(document.data().beds);
                $('#editEmployeeModal').modal('show');
            } else {
                console.log("No such document!");
            }
        }).catch(function (error) {
            console.log("Error getting document:", error);
        });
    });

    $("#edit-employee-form").submit(function (event) {
        event.preventDefault();
        let id = $(this).attr('edit-id');
        db.collection('hospitals').doc(id).update({
            name: $('#edit-employee-form #hospname').val(),
            area: $('#edit-employee-form #hosparea').val(),
            phone: $('#edit-employee-form #hospphone').val(),
            beds: $('#edit-employee-form  #hospbeds').val()
        });
        $('#editEmployeeModal').modal('hide');
    });

    $("#addEmployeeModal").on('hidden.bs.modal', function () {
        $('#add-employee-form .form-control').val('');
    });

    $("#editEmployeeModal").on('hidden.bs.modal', function () {
        $('#edit-employee-form .form-control').val('');
    });

    // PAGINATION
    $("#js-previous").on('click', function (e) {
        e.preventDefault();
        $('#employee-table tbody').html('');
        const queryPrevious = employeeRef
            .endBefore(lastVisiblehospitalsnapShot)
            .limit(2);

        queryPrevious.get().then(snap => {
            snap.forEach(doc => {
                renderEmployee(doc);
            });
            lastVisibleEmployeeSnapShot = snap.docs[snap.docs.length - 1];
        });
    });

    $('#js-next').on('click', function (e) {
        e.preventDefault();
        if ($(this).closest('.page-item').hasClass('disabled')) {
            return false;
        }
        $('#employee-table tbody').html('');
        const queryNext = employeeRef
            .startAfter(lastVisibleEmployeeSnapShot)
            .limit(2);

        queryNext.get().then(snap => {
            snap.forEach(doc => {
                renderEmployee(doc);
            });
            lastVisibleEmployeeSnapShot = snap.docs[snap.docs.length - 1];
        });
    });

    // SEARCH
    $("#search-name").keyup(function () {
        $('#employee-table tbody').html('');
        let nameKeyword = $("#search-name").val();
        console.log(nameKeyword);
        employeeRef.orderByChild("name").startAt(nameKeyword).endAt(nameKeyword+"\uf8ff").get()
            .then(function (documentSnapshots) {
                documentSnapshots.docs.forEach(doc => {
                    renderEmployee(doc);
                });
            });
    });
});






// CENTER MODAL
(function ($) {
    "use strict";

    function centerModal() {
        $(this).css('display', 'block');
        var $dialog = $(this).find(".modal-dialog"),
            offset = ($(window).height() - $dialog.height()) / 2,
            bottomMargin = parseInt($dialog.css('marginBottom'), 10);

        // Make sure you don't hide the top part of the modal w/ a negative margin if it's longer than the screen height, and keep the margin equal to the bottom margin of the modal
        if (offset < bottomMargin) offset = bottomMargin;
        $dialog.css("margin-top", offset);
    }

    $(document).on('show.bs.modal', '.modal', centerModal);
    $(window).on("resize", function () {
        $('.modal:visible').each(centerModal);
    });
}(jQuery));