def sort_and_merge_lists(list1, list2):
    # İkinci listedeki elemanları alfabetik sıraya göre sırala
    sorted_list2 = sorted(list2)

    # İlk listeden ikinci listedeki elemanları çıkar
    list1 = [item for item in list1 if item not in sorted_list2]

    # İlk listede kalan elemanları alfabetik sıraya göre sırala
    sorted_list1 = sorted(list1)

    # İkinci listedeki elemanları birinci listenin başına ekle
    result_list = sorted_list2 + sorted_list1

    return result_list

def sanitize_text(text):
    return ' '.join(text.strip().split())

def validate_field(field):
    if field is None or sanitize_text(field) == "":
        return False
    return True
