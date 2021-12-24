"use strict";
/*** REGION 1 - Global variables - Vùng khai báo biến, hằng số, tham số TOÀN CỤC */
// mảng toàn cục chứa các tên giá trị của các cột trong table khi đổ dữ liệu
const gORDER_COL = ["orderId", "kichCo", "loaiPizza", "idLoaiNuocUong", "thanhTien", "hoTen", "soDienThoai", "trangThai", "detail"];

const gORDER_ID_COL = 0;
const gORDER_SIZE_COL = 1;
const gORDER_TYPE_PIZZA_COL = 2;
const gORDER_DRINK_COL = 3;
const gORDER_PRICE_COL = 4;
const gORDER_FULL_NAME_COL = 5;
const gORDER_PHONE_COL = 6;
const gORDER_STATUS_COL = 7;
const gORDER_DETAIL_COL = 8;


// biến toàn cục obj DB
var gOrderDB = {
    orders: [],
    // phương thức của object
    filterOrders: function (paramFilterObj) {
        var vOrderFilterList = [];
        vOrderFilterList = this.orders.filter((bOrder) => {
            return ((bOrder.trangThai === paramFilterObj.trangThai || paramFilterObj.trangThai === "none")
                && (bOrder.loaiPizza === paramFilterObj.loaiPizza || paramFilterObj.loaiPizza === "none"))
        });
        return vOrderFilterList;
    },
    addNewOrder: function (paramNewOrderObj) {
        this.orders.push(paramNewOrderObj);
    }

}

var gId = 0;

// biến toàn cục chứa thông tin menu combo 
var gMenuCombo = [
    {
        size: "S",
        diameter: 20,
        gribGrills: 2,
        salad: 200,
        drinkNumber: 2,
        price: 150000
    },
    {
        size: "M",
        diameter: 25,
        gribGrills: 4,
        salad: 300,
        drinkNumber: 3,
        price: 200000
    },
    {
        size: "L",
        diameter: 30,
        gribGrills: 8,
        salad: 500,
        drinkNumber: 4,
        price: 250000
    }
]


// Khai báo DataTable & mapping collumns
var gOrderTable = $("#table-order").DataTable({
    // Khai báo các cột của datatable
    columns: [
        { data: gORDER_COL[gORDER_ID_COL] },
        { data: gORDER_COL[gORDER_SIZE_COL] },
        { data: gORDER_COL[gORDER_TYPE_PIZZA_COL] },
        { data: gORDER_COL[gORDER_DRINK_COL] },
        { data: gORDER_COL[gORDER_PRICE_COL] },
        { data: gORDER_COL[gORDER_FULL_NAME_COL] },
        { data: gORDER_COL[gORDER_PHONE_COL] },
        { data: gORDER_COL[gORDER_STATUS_COL] },
        { data: gORDER_COL[gORDER_DETAIL_COL] },

    ],
    // định nghĩa lại các cột
    columnDefs: [
        {// định nghĩa cột detail
            targets: gORDER_DETAIL_COL,
            defaultContent: `
                <span ><i class="fas fa-edit fa-lg text-primary edit-order " style="cursor: pointer" data-toggle="tooltip" title="Edit"></i></span>
                <span ><i class="far fa-trash-alt fa-lg ml-2 text-danger delete-order" style="cursor: pointer" data-toggle="tooltip" title="Delete"></i></span>
            `
        }
    ],
})


/*** REGION 2 - Vùng gán / thực thi sự kiện cho các elements */
$(document).ready(function () {
    // hàm sự kiện khi load trang
    onPageLoading();
    // hàm sự kiện click nút lọc (filter)
    $("#btn-fill").on("click", onBtnFilterOrderClick);
    // hàm sự kiện click nút create (tạo mới đơn hàng)
    $("#btn-create").on("click", onBtnCreateOrderClick);
    // hàm sự kiện click nút add new (lưu đơn hàng vào database)
    $("#btn-addNewOrder").on("click", onBtnAddNewOrderClick);

    // hàm sự kiện change ô select size (chọn size bánh)
    $("#inp-new-select-sizePizza").on("change", function () {
        onChangeSelectSizePizza(this);
    });

    // hàm sự kiện click icon edit (xem chi tiết đơn hàng và cập nhật trạng thái)
    $("#table-order").on("click", ".edit-order", function () {
        onIconEditOrderClick(this);
    });

    // hàm sự kiện click icon delete xóa đơn hàng
    $("#table-order").on("click", ".delete-order", function () {
        onIconDeleteOrderClick(this);
    });

    // hàm sự kiện click nút confirm xác nhận đơn hàng
    $("#btn-confirm").on("click", onBtnConfirmOrderClick);

    // hàm sự kiện click nút cancel hủy đơn hàng
    $("#btn-cancel").on("click", onBtnCancelOrderClick);

    // hàm sự kiện click nút confirmDelete trong modal delete -> xóa đơn hàng
    $("#btn-confirmDelete").on("click", onBtnConfirmDeleteOrderClick);


    //reset dữ liệu khi click nút cancel
    $('#modalCreateOrder').on('hidden.bs.modal', function () {
        resetModalFormToStart();
    });
})

/*** REGION 3 - Event handlers - Vùng khai báo các hàm xử lý sự kiện */
// hàm xử lý sự kiện load trang gọi Api lấy dữ liệu order hiển thị lên Table
function onPageLoading() {
    "use strict";
    callApiGetAllOrderListAndLoadDataToTable();
}

// hàm xử lý sự kiện khi click nút filter lọc dữ liệu đúng hiển thị lên table
function onBtnFilterOrderClick() {
    "use strict";
    var vFilterOrderObj = {
        trangThai: "",
        loaiPizza: "",
    }
    //B1: thu thập dữ liệu
    getDataFilter(vFilterOrderObj);
    //B2: validate (không có)
    //B3: xử lý hiển thị trên giao diện (lọc dữ liệu và show lên table)
    var vFilterOrderList = gOrderDB.filterOrders(vFilterOrderObj);
    // hiển thị lại bảng table
    loadDataOrderListToTable(vFilterOrderList);

}

// hàm xử lý sự kiện khi click nút create thêm đơn hàng mới
function onBtnCreateOrderClick() {
    "use strict";
    // truy xuất phần tử select modal form create
    var vSelectElement = $("#inp-new-select-drink");
    //B1: thu thập dữ liệu (không có)
    //B2: validate (không có)
    //B3: call Api lấy dữ liệu đồ uống hiển thị lên select trên form
    callAPIGetDrinkListAndShowToModalFormSelect(vSelectElement);

    // hiển thị modal form create lên
    $("#modalCreateOrder").modal("show");
}

// hàm xử lý sự kiện click nút add new (tạo mới đơn hàng lưu vào DB và hiển lên table)
function onBtnAddNewOrderClick() {
    "use strict";
    // Object chứa thông tin của đơn hàng (order)
    var vNewOrderObj = {
        kichCo: "",
        duongKinh: "",
        suon: "",
        salad: "",
        loaiPizza: "",
        idVourcher: "",
        idLoaiNuocUong: "",
        soLuongNuoc: "",
        hoTen: "",
        thanhTien: "",
        email: "",
        soDienThoai: "",
        diaChi: "",
        loiNhan: ""
    }
    //B1: thu thập dữ liệu
    getDataToModalForm(vNewOrderObj);
    //B2: validate dữ liệu
    var vIsValidateData = validateDataOrder(vNewOrderObj);
    if (vIsValidateData) {
        //B3: call API tạo đơn hàng mới
        $.ajax({
            url: "http://42.115.221.44:8080/devcamp-pizza365/orders",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(vNewOrderObj),
            success: function (res) {
                // console.log(res);
                //B4: xử lý hiển thị thêm order mới thành công vào DB và hiển thị lên bảng
                gOrderDB.addNewOrder(res);
                // alert("Thêm order mới thành công!");
                toastr.success(`"Thêm order mới thành công!"`);
                // hiển thị lại bảng table
                loadDataOrderListToTable(gOrderDB.orders);
                // ẩn modal form create đi
                $("#modalCreateOrder").modal("hide");

            },
            error: function (error) {
                console.assert(error.responseText);
            },
        })
    }
}

// hàm xử lý sự kiện khi change khi chọn size bánh ở ô select hiển thị thông tin menu tương ứng lên form modal create
function onChangeSelectSizePizza(paramSelectElement) {
    "use strict";
    // lấy value ở option tương ứng dc chọn (size pizza)
    var vValueOptionPizzaSize = $(paramSelectElement).find("option:selected").val();
    // console.log(vValueOptionSizePizza);
    // lấy thông tin menu combo object từ size value
    var vMenuComboObject = getMenuComboObjectBySizeValue(vValueOptionPizzaSize);
    // console.log({vMenuComboObject});
    // hàm hiển thị dữ liệu menu combo tương ứng lên các field trên form modal create
    loadDataMenuComboToModalFormCreate(vMenuComboObject);
}

// hàm xử lý sự kiện khi click icon edit (hiển thị modal form detail và xem lại đơn hàng và cập nhật trạng thái)
function onIconEditOrderClick(paramIconEdit) {
    "use strict";
    //B1: thu thập dữ liệu
    var vDataOrderRow = getOrderDataToRow(paramIconEdit);
    gId = vDataOrderRow.id;
    //B2: validate (không có)
    //B3: xử lý hiển thị dữ liệu tương ứng row được click lên các field modal form detail
    loadDataOrderRowSelectedToModalFormDetail(vDataOrderRow);
    // hiển thị modal form detail
    $("#modalOrderDetail").modal("show");
}

// hàm xử lý sự kiện khi click icon delete (hiển thị modal thông báo xác nhận)
function onIconDeleteOrderClick(paramIconDelete) {
    "use strict";
    // hiển thị modal form delete
    $("#modalConfirmDelete").modal("show");
    // lấy dữ liệu row tương ứng icon dc click và gán giá trị id cho biến toàn cục
    var vDataRow = getOrderDataToRow(paramIconDelete);
    gId = vDataRow.id;
}


// hàm xử lý sự kiện click nút confirm modal detail xác nhận đơn hàng
function onBtnConfirmOrderClick() {
    "use strict";
    var OrderUpdateObj = {
        trangThai: ""
    }
    //B1: thu thập dữ liệu
    getDataSelectForm(OrderUpdateObj);
    //B2: validate không có
    //B3: call Api update trạng thái đơn hàng
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-pizza365/orders/" + gId,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(OrderUpdateObj),
        success: function (res) {
            // console.log(res);
            //B4: xử lý hiển thị trạng thái đơn hàng đã được cập nhập trên table
            // alert("Đơn hàng được xác nhận. Vui lòng xem lại trạng thái!");
            toastr.success(`Đơn hàng ${res.id} đã xác nhận. Vui lòng xem lại trạng thái!`);
            // ẩn modal detail đi
            $("#modalOrderDetail").modal("hide");
            // hiển thị lại bảng
            callApiGetAllOrderListAndLoadDataToTable(gOrderDB.orders);

        },
        error: function (error) {
            console.assert(error.responseText);
        },
    });
}

// hàm xử lý sự kiện click nút cancel modal detail hủy đơn hàng
function onBtnCancelOrderClick() {
    "use strict";
    var OrderUpdateObj = {
        trangThai: ""
    }
    //B1: thu thập dữ liệu
    getDataSelectForm(OrderUpdateObj);
    //B2: validate không có
    //B3: call Api update trạng thái đơn hàng
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-pizza365/orders/" + gId,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(OrderUpdateObj),
        success: function (res) {
            //B4: xử lý hiển thị trạng thái đơn hàng đã được cập nhập 
            // alert("Đơn hàng đã được hủy. Vui lòng xem lại trạng thái!");
            toastr.warning(`Đơn hàng ${res.id} đã được hủy. Vui lòng xem lại trạng thái!`);
            // ẩn modal detail đi
            $("#modalOrderDetail").modal("hide");
            // hiển thị lại bảng
            callApiGetAllOrderListAndLoadDataToTable(gOrderDB.orders);

        },
        error: function (error) {
            console.assert(error.responseText);
        },
    })
}

// hàm xử lý sự kiện click nút confirm trong modal delete để xóa đơn đặt hàng
function onBtnConfirmDeleteOrderClick() {
    "use strict";
    //B1: thu thập dữ liệu (đã làm ở bước sự kiện iconDelete trên)
    //B2: validate (không có)
    //B3: call Api xóa đơn hàng
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-pizza365/orders/" + gId,
        type: "DELETE",
        dataType: "json",
        success: function (res) {
            //B4: xử lý hiển thị trên giao diện
            // alert("Đơn hàng " + gId + " đã được xóa thành công!");
            toastr.error(`Đơn hàng ${gId} đã được xóa thành công!`);
            // ẩn modal delete
            $("#modalConfirmDelete").modal("hide");
            // hiển thị lại bảng
            callApiGetAllOrderListAndLoadDataToTable(gOrderDB.orders);
        },
        error: function (error) {
            console.assert(error.responseText);
        },
    });
}


/*** REGION 4 - Common funtions - Vùng khai báo hàm dùng chung trong toàn bộ chương trình*/
// hàm thu thập dữ liệu đơn hàng từ modal form
function getDataToModalForm(paramOrderObj) {
    "use strict";
    paramOrderObj.hoTen = $("#inp-new-fullName").val().trim();
    paramOrderObj.email = $("#inp-new-email").val().trim();
    paramOrderObj.soDienThoai = $("#inp-new-phone").val().trim();
    paramOrderObj.diaChi = $("#inp-new-address").val().trim();
    paramOrderObj.kichCo = $("#inp-new-select-sizePizza option:selected").val();
    paramOrderObj.duongKinh = $("#inp-new-diameter").val().trim();
    paramOrderObj.suon = $("#inp-new-grill").val().trim();
    paramOrderObj.salad = $("#inp-new-salad").val().trim();
    paramOrderObj.soLuongNuoc = $("#inp-new-drinks-number").val().trim();
    paramOrderObj.loaiPizza = $("#inp-new-select-typePizza option:selected").val();
    paramOrderObj.idLoaiNuocUong = $("#inp-new-select-drink option:selected").val();
    paramOrderObj.idVourcher = $("#inp-new-voucherId").val().trim();
    paramOrderObj.loiNhan = $("#inp-new-message").val().trim();
    paramOrderObj.thanhTien = $("#inp-new-price").val().trim();
    // call api lấy phần trăm giảm giá (nếu có)
    callApiCheckVoucherIdAndReturnPercentDiscount(paramOrderObj.idVourcher);

}

// hàm thu thập dữ liệu để filter
function getDataFilter(paramFilterOrderObj) {
    "use strict";
    paramFilterOrderObj.trangThai = $("#select-status option:selected").val().trim();
    paramFilterOrderObj.loaiPizza = $("#select-pizza option:selected").val().trim();
}

// hàm thu thập dữ liệu trạng thái đẻ update
function getDataSelectForm(paramOrderUpdate) {
    "use strict";
    paramOrderUpdate.trangThai = $("#inp-statusOrder option:selected").val();
}

// hàm validate dữ liệu đầu vào trên modal form 
function validateDataOrder(paramOrderObj) {
    "use strict";
    if (paramOrderObj.hoTen === "") {
        alert("Xin nhập họ tên!");
        return false;
    }
    if (!validateEmail(paramOrderObj.email)) {
        alert("Email không đúng định dạng!");
        return false;
    }
    if (paramOrderObj.soDienThoai === "" || isNaN(paramOrderObj.soDienThoai)) {
        alert("Xin nhập số điện thoại!");
        return false;
    }
    if (paramOrderObj.diaChi === "") {
        alert("Xin nhập địa chỉ!");
        return false;
    }
    if (paramOrderObj.kichCo === "none") {
        alert("Xin chọn size bánh!");
        return false;
    }
    if (paramOrderObj.loaiPizza === "none") {
        alert("Xin chọn loại bánh Pizza!");
        return false;
    }
    if (paramOrderObj.idLoaiNuocUong === "none") {
        alert("Xin chọn đồ uống!");
        return false;
    }
    return true;
}


// hàm call API lấy dữ liệu danh sách đơn hàng
function callApiGetAllOrderListAndLoadDataToTable() {
    "use strict";
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-pizza365/orders",
        type: "GET",
        dataType: "json",
        success: function (res) {
            gOrderDB.orders = res;
            // hiển thị dữ liệu lên bảng table
            loadDataOrderListToTable(gOrderDB.orders);
        },
        error: function (error) {
            console.assert(error.responseText);
        },
    });
}

// hàm call Api lấy danh sách đồ uống
function callAPIGetDrinkListAndShowToModalFormSelect(paramSelectElement) {
    "use strict";
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-pizza365/drinks",
        type: "GET",
        dataType: "json",
        async: true,
        success: function (res) {
            // hiển thị danh sách đồ uống lên select/option modal form
            loadDrinkListToSelectOption(res, paramSelectElement);
        },
        error: function (error) {
            console.assert(error.responseText);
        },
    });
}

// hàm call Api lấy phần trăm giảm giá thông qua voucherId
function callApiCheckVoucherIdAndReturnPercentDiscount(paramVoucherId) {
    "use strict";
    var vPercentDiscount = 0;
    $.ajax({
        url: "http://42.115.221.44:8080/devcamp-voucher-api/voucher_detail/" + paramVoucherId,
        type: "GET",
        dataType: "json",
        // async: false,
        success: function (res) {
            vPercentDiscount = res.phanTramGiamGia;
            toastr.info("Mã voucher được giảm giá " + vPercentDiscount + "%");
        },
        error: function (error) {
            console.assert(error.responseText);
            toastr.info("Mã voucher không được giảm giá");
        },
    });
}

// hàm lấy object menu combo tương ứng thông qua tham số size pizza truyền vào
function getMenuComboObjectBySizeValue(paramPizzaSizeValue) {
    "use strict";
    var vIsFound = false;
    var vIndex = 0;
    var vMenuComboObj = null;
    while (!vIsFound & vIndex < gMenuCombo.length) {
        if (gMenuCombo[vIndex].size === paramPizzaSizeValue) {
            vIsFound = true;
            vMenuComboObj = gMenuCombo[vIndex];
        } else {
            vIndex++;
        }
    }
    return vMenuComboObj;
}

// hàm hiển thị danh sách đồ uống lên select/option của modal form detail
function loadDrinkListToSelectOption(paramResponseDrinkList, paramSelectElement) {
    "use strict";
    $(paramSelectElement).find("option:gt(0)").remove();
    paramResponseDrinkList.map((bItem) => {
        $(paramSelectElement).append(`
            <option value="${bItem.maNuocUong}">${bItem.tenNuocUong}</option>
        `);
    })
}

// hàm hiển thị dữ liệu thông tin menu combo lên các field input trên form modal create (khi tạo mới đơn hàng)
function loadDataMenuComboToModalFormCreate(paramMenuComboObj) {
    "use strict";
    // gán giá trị các thông tin của menu combo lên các field input của form create
    $("#inp-new-diameter").val(paramMenuComboObj.diameter);
    $("#inp-new-grill").val(paramMenuComboObj.gribGrills);
    $("#inp-new-salad").val(paramMenuComboObj.salad);
    $("#inp-new-drinks-number").val(paramMenuComboObj.drinkNumber);
    $("#inp-new-price").val(paramMenuComboObj.price);
}

// hàm hiển thị dữ liệu thông tin order của row được chọn lên form modal detail
function loadDataOrderRowSelectedToModalFormDetail(paramDataRowOrder) {
    "use strict";
    //reset select size pizza trên form
    $("#select-combo").find("option").remove();
    $("#select-drink").find("option").remove();

    $("#inp-orderId").val(paramDataRowOrder.orderId);
    $("#select-combo").append(`<option>${paramDataRowOrder.kichCo}</option>`);
    $("#inp-diameter").val(paramDataRowOrder.duongKinh);
    $("#inp-grill").val(paramDataRowOrder.suon);
    $("#select-drink").append(`<option>${paramDataRowOrder.idLoaiNuocUong}</option>`)
    $("#inp-numberDrinks").val(paramDataRowOrder.soLuongNuoc);
    $("#inp-voucherId").val(paramDataRowOrder.idVourcher);
    $("#inp-typePizza").val(paramDataRowOrder.loaiPizza);
    $("#inp-salad").val(paramDataRowOrder.salad);
    $("#inp-total").val(paramDataRowOrder.thanhTien);
    $("#inp-discount").val(paramDataRowOrder.giamGia);
    $("#inp-fullName").val(paramDataRowOrder.hoTen);
    $("#inp-email").val(paramDataRowOrder.email);
    $("#inp-phone").val(paramDataRowOrder.soDienThoai);
    $("#inp-address").val(paramDataRowOrder.diaChi);
    $("#inp-message").val(paramDataRowOrder.loiNhan);
    $("#inp-statusOrder option").filter(function() {
        return $(this).val() === paramDataRowOrder.trangThai;
    }).prop("selected", true);
    $("#inp-orderDay").val(paramDataRowOrder.ngayTao);
    $("#inp-updateDay").val(paramDataRowOrder.ngayCapNhat);
}


// hàm hiển thị dữ liệu đơn hàng (order) lên table
function loadDataOrderListToTable(paramResponseObj) {
    "use strict";
    //Xóa toàn bộ dữ liệu đang có của bảng
    gOrderTable.clear();
    //Cập nhật data cho bảng 
    gOrderTable.rows.add(paramResponseObj);
    //Cập nhật lại giao diện hiển thị bảng
    gOrderTable.draw();
}

// hàm lấy thông tin order tương ứng của một row table
function getOrderDataToRow(paramIconEdit) {
    "use strict";
    var vRowSelected = $(paramIconEdit).closest("tr");
    var vDataRow = gOrderTable.row(vRowSelected).data();
    // console.log(vDataRow);
    return vDataRow;
}

// hàm kiểm tra email đúng định dạng -> đúng return true
function validateEmail(paramEmail) {
    "use strict";
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(paramEmail).toLowerCase());
}

// hàm reset các field trên modal form
function resetModalFormToStart() {
    "use strict";

    gId = 0;

    $("#inp-new-fullName").val("");
    $("#inp-new-email").val("");
    $("#inp-new-phone").val("");
    $("#inp-new-address").val("");
    $("#inp-new-select-sizePizza").prop('selectedIndex', 0);
    $("#inp-new-diameter").val("");
    $("#inp-new-grill").val("");
    $("#inp-new-salad").val("");
    $("#inp-new-drinks-number").val("");
    $("#inp-new-price").val("");
    $("#inp-new-select-typePizza").prop('selectedIndex', 0);
    $("#inp-new-select-drink").prop('selectedIndex', 0);
    $("#inp-new-voucherId").val("");
    $("#inp-new-message").val("");
}