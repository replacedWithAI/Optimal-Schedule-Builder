def num_terms_in_this_section(self, term: str) -> list[int]:
    if term == 'F' or 'S1':
        return [0]
    elif term == 'W' or 'S2':
        return [1]
    elif term == 'Y' or 'SU':
        return [0, 1]